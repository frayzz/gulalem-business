<?php

namespace App\Actions\Inventory;

use App\Models\BouquetRecipeItem;
use App\Models\InventoryMovement;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Services\Stores;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    public function __construct(private Stores $stores)
    {
    }

    public function intake(array $data): ProductBatch
    {
        return DB::transaction(function () use ($data) {
            $shopId = $this->resolveStoreId();

            /** @var ProductBatch $batch */
            $batch = ProductBatch::create([
                'shop_id' => $shopId,
                'product_id' => $data['product_id'],
                'supplier_id' => $data['supplier_id'] ?? null,
                'buy_price' => $data['buy_price'],
                'qty_in' => $data['qty'],
                'qty_left' => $data['qty'],
                'arrived_at' => $data['arrived_at'],
                'expires_at' => $data['expires_at'] ?? null,
            ]);

            InventoryMovement::create([
                'shop_id' => $shopId,
                'product_id' => $batch->product_id,
                'batch_id' => $batch->id,
                'type' => InventoryMovement::TYPE_IN,
                'qty' => $data['qty'],
                'reason' => $data['reason'] ?? 'intake',
                'user_id' => $data['user_id'] ?? null,
            ]);

            return $batch;
        });
    }

    public function adjust(Product $product, float $qty, ?int $batchId = null, ?string $reason = null, ?int $userId = null): InventoryMovement
    {
        $shopId = $this->resolveStoreId();

        return InventoryMovement::create([
            'shop_id' => $shopId,
            'product_id' => $product->id,
            'batch_id' => $batchId,
            'type' => InventoryMovement::TYPE_ADJUST,
            'qty' => $qty,
            'reason' => $reason,
            'user_id' => $userId,
        ]);
    }

    public function writeOff(Product $product, float $qty, ?int $orderId = null, ?string $reason = null, ?int $userId = null, ?int $shopId = null): void
    {
        DB::transaction(function () use ($product, $qty, $orderId, $reason, $userId, $shopId) {
            $storeId = $this->resolveStoreId(orderId: $orderId, shopId: $shopId);
            $remaining = $qty;

            $batches = ProductBatch::where('product_id', $product->id)
                ->where('shop_id', $storeId)
                ->where('qty_left', '>', 0)
                ->orderBy('arrived_at')
                ->lockForUpdate()
                ->get();

            foreach ($batches as $batch) {
                if ($remaining <= 0) {
                    break;
                }

                $consume = min($batch->qty_left, $remaining);
                $batch->decrement('qty_left', $consume);

                InventoryMovement::create([
                    'shop_id' => $storeId,
                    'product_id' => $product->id,
                    'batch_id' => $batch->id,
                    'type' => InventoryMovement::TYPE_OUT,
                    'qty' => $consume,
                    'reason' => $reason ?? 'write-off',
                    'order_id' => $orderId,
                    'user_id' => $userId,
                ]);

                $remaining -= $consume;
            }

            if ($remaining > 0) {
                Log::warning('Inventory write-off exceeds available stock', [
                    'product_id' => $product->id,
                    'remaining' => $remaining,
                    'order_id' => $orderId,
                ]);

                InventoryMovement::create([
                    'shop_id' => $storeId,
                    'product_id' => $product->id,
                    'batch_id' => null,
                    'type' => InventoryMovement::TYPE_OUT,
                    'qty' => $remaining,
                    'reason' => $reason ?? 'write-off-overdraft',
                    'order_id' => $orderId,
                    'user_id' => $userId,
                ]);
            }
        });
    }

    public function consumeForOrder(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $shopId = $this->resolveStoreId($order);
            $order->loadMissing('items.product.bouquetRecipe.items');

            foreach ($order->items as $item) {
                $product = $item->product;

                if ($product->type === Product::TYPE_BOUQUET) {
                    if (!$product->bouquetRecipe) {
                        throw new RuntimeException("Bouquet {$product->id} is missing a recipe");
                    }

                    $this->consumeBouquet($product->bouquetRecipe->items, $item->qty, $order->id, $shopId);

                    foreach ($product->bouquetRecipe->items as $recipeItem) {
                        InventoryReservation::where('order_id', $order->id)
                            ->where('shop_id', $shopId)
                            ->where('product_id', $recipeItem->product_id)
                            ->delete();
                    }
                } else {
                    $this->writeOff($product, $item->qty, $order->id, 'order-fulfillment', shopId: $shopId);

                    InventoryReservation::where('order_id', $order->id)
                        ->where('shop_id', $shopId)
                        ->where('product_id', $product->id)
                        ->delete();
                }
            }
        });
    }

    public function assertAvailabilityForOrder(Order $order): void
    {
        $order->loadMissing('items.product.bouquetRecipe.items');

        $requirements = [];

        foreach ($order->items as $item) {
            $product = $item->product;

            if ($product->type === Product::TYPE_BOUQUET) {
                if (!$product->bouquetRecipe) {
                    throw new RuntimeException("Bouquet {$product->id} is missing a recipe");
                }

                foreach ($product->bouquetRecipe->items as $recipeItem) {
                    $requirements[$recipeItem->product_id] = ($requirements[$recipeItem->product_id] ?? 0) + ($item->qty * $recipeItem->qty);
                }

                continue;
            }

            $requirements[$product->id] = ($requirements[$product->id] ?? 0) + $item->qty;
        }

        foreach ($requirements as $productId => $requiredQty) {
            $product = Product::findOrFail($productId);
            $available = $this->getAvailableQty($product, $order->id, $order->shop_id);

            if ($available < $requiredQty) {
                throw ValidationException::withMessages([
                    'items' => "Недостаточно товара '{$product->name}'. Требуется {$requiredQty}, доступно {$available}.",
                ]);
            }
        }
    }

    /**
     * @param \Illuminate\Support\Collection<int, BouquetRecipeItem> $recipeItems
     */
    protected function consumeBouquet($recipeItems, float $orderQty, int $orderId, int $shopId): void
    {
        foreach ($recipeItems as $item) {
            $requiredQty = $orderQty * $item->qty;
            $this->writeOff($item->product, $requiredQty, $orderId, 'bouquet-component', shopId: $shopId);
        }
    }

    public function reserveForOrder(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $shopId = $this->resolveStoreId($order);
            $order->loadMissing('items.product.bouquetRecipe.items');

            foreach ($order->items as $item) {
                $product = $item->product;

                if ($product->type === Product::TYPE_BOUQUET) {
                    if (!$product->bouquetRecipe) {
                        throw new RuntimeException("Bouquet {$product->id} is missing a recipe");
                    }

                    foreach ($product->bouquetRecipe->items as $recipeItem) {
                        $requiredQty = $item->qty * $recipeItem->qty;

                        InventoryReservation::updateOrCreate(
                            ['order_id' => $order->id, 'product_id' => $recipeItem->product_id, 'shop_id' => $shopId],
                            ['qty' => $requiredQty]
                        );

                        InventoryMovement::create([
                            'shop_id' => $shopId,
                            'product_id' => $recipeItem->product_id,
                            'batch_id' => null,
                            'type' => InventoryMovement::TYPE_RESERVE,
                            'qty' => $requiredQty,
                            'reason' => 'order-reservation',
                            'order_id' => $order->id,
                        ]);
                    }

                    continue;
                }

                InventoryReservation::updateOrCreate(
                    ['order_id' => $order->id, 'product_id' => $product->id, 'shop_id' => $shopId],
                    ['qty' => $item->qty]
                );

                InventoryMovement::create([
                    'shop_id' => $shopId,
                    'product_id' => $product->id,
                    'batch_id' => null,
                    'type' => InventoryMovement::TYPE_RESERVE,
                    'qty' => $item->qty,
                    'reason' => 'order-reservation',
                    'order_id' => $order->id,
                ]);
            }
        });
    }

    public function releaseReservation(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $shopId = $this->resolveStoreId($order);
            $reservations = InventoryReservation::where('order_id', $order->id)
                ->where('shop_id', $shopId)
                ->get();

            foreach ($reservations as $reservation) {
                InventoryMovement::create([
                    'shop_id' => $shopId,
                    'product_id' => $reservation->product_id,
                    'batch_id' => null,
                    'type' => InventoryMovement::TYPE_RELEASE,
                    'qty' => $reservation->qty,
                    'reason' => 'order-cancelled',
                    'order_id' => $order->id,
                ]);
            }

            InventoryReservation::where('order_id', $order->id)->where('shop_id', $shopId)->delete();
        });
    }

    protected function calculateBouquetQty(Product $product, float $orderQty): float
    {
        if (!$product->bouquetRecipe) {
            throw new RuntimeException("Bouquet {$product->id} is missing a recipe");
        }

        $total = 0;

        foreach ($product->bouquetRecipe->items as $item) {
            $total += $item->qty * $orderQty;
        }

        return $total;
    }

    public function getAvailableQty(Product $product, ?int $orderId = null, ?int $shopId = null): float
    {
        $storeId = $this->resolveStoreId(orderId: $orderId, shopId: $shopId);
        $stock = ProductBatch::where('product_id', $product->id)
            ->where('shop_id', $storeId)
            ->sum('qty_left');

        $reservedQuery = InventoryReservation::where('product_id', $product->id)
            ->where('shop_id', $storeId);

        if ($orderId !== null) {
            $reservedQuery->where('order_id', '!=', $orderId);
        }

        $reserved = $reservedQuery->sum('qty');

        return max(0, $stock - $reserved);
    }

    private function resolveStoreId(?Order $order = null, ?int $orderId = null, ?int $shopId = null): int
    {
        if ($shopId !== null) {
            return $shopId;
        }

        if ($order?->shop_id) {
            return $order->shop_id;
        }

        if ($orderId) {
            $resolved = Order::whereKey($orderId)->value('shop_id');

            if ($resolved) {
                return (int) $resolved;
            }
        }

        return $this->stores->currentId();
    }
}
