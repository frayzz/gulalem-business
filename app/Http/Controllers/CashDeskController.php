<?php

namespace App\Http\Controllers;

use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductBatch;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CashDeskController extends Controller
{
    public function index(): Response
    {
        $today = Carbon::today();

        $payments = Payment::with('order')->latest()->take(12)->get()->map(function (Payment $payment) {
            return [
                'id' => $payment->id,
                'method' => $payment->method,
                'amount' => (float) $payment->amount,
                'order_id' => $payment->order_id,
                'created_at' => $payment->created_at,
            ];
        });

        $methodTotals = Payment::selectRaw('method, SUM(amount) as total')
            ->groupBy('method')
            ->pluck('total', 'method');

        $paymentsToday = Payment::whereDate('created_at', $today)->sum('amount');

        $openOrders = Order::where('payment_status', '!=', 'paid')
            ->latest()
            ->take(6)
            ->get(['id', 'total', 'paid_total', 'payment_status']);

        return Inertia::render('cash-desk/index', [
            'payments' => $payments,
            'methodTotals' => $methodTotals,
            'paymentsToday' => (float) $paymentsToday,
            'openOrders' => $openOrders,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'method' => ['required', 'string', 'max:50'],
            'amount' => ['required', 'numeric', 'min:1'],
            'order_id' => ['required', 'integer', 'exists:orders,id'],
        ]);

        DB::transaction(function () use ($validated) {
            $payment = Payment::create([
                'order_id' => $validated['order_id'],
                'method' => $validated['method'],
                'amount' => $validated['amount'],
            ]);

            if (! $payment->order_id) {
                return;
            }

            $order = Order::with(['items.product.bouquetRecipe.items', 'items.product.bouquetRecipe.items.product'])
                ->find($payment->order_id);

            if (! $order) {
                return;
            }

            $order->paid_total = (float) $order->paid_total + (float) $payment->amount;
            $order->payment_status = $order->paid_total >= (float) $order->total ? 'paid' : 'partial';
            $order->save();

            $this->writeOffInventory($order);
        });

        return back()->with('success', 'Оплата проведена через кассу и списана со склада.');
    }

    private function writeOffInventory(Order $order): void
    {
        $alreadyWrittenOff = InventoryMovement::where('order_id', $order->id)->exists();

        if ($alreadyWrittenOff || $order->payment_status !== 'paid') {
            return;
        }

        foreach ($order->items as $item) {
            $components = $this->expandComponents($item);

            foreach ($components as $productId => $qty) {
                $this->consumeFromBatches((int) $productId, $qty, $order->id);
            }
        }
    }

    /**
     * @return array<int, float>
     */
    private function expandComponents(OrderItem $item): array
    {
        $product = $item->product;

        if (! $product) {
            return [];
        }

        if ($product->type !== Product::TYPE_BOUQUET || ! $product->bouquetRecipe) {
            return [$product->id => (float) $item->qty];
        }

        $components = [];

        foreach ($product->bouquetRecipe->items as $recipeItem) {
            if (! $recipeItem->product_id) {
                continue;
            }

            $components[$recipeItem->product_id] = ($components[$recipeItem->product_id] ?? 0)
                + ((float) $recipeItem->qty * (float) $item->qty);
        }

        return $components;
    }

    private function consumeFromBatches(int $productId, float $qtyNeeded, int $orderId): void
    {
        $batches = ProductBatch::where('product_id', $productId)
            ->where('qty_left', '>', 0)
            ->orderBy('arrived_at')
            ->orderBy('id')
            ->get();

        $remaining = $qtyNeeded;

        /** @var Collection<int, ProductBatch> $batches */
        foreach ($batches as $batch) {
            if ($remaining <= 0) {
                break;
            }

            $deduct = min($remaining, (float) $batch->qty_left);
            $batch->qty_left = (float) $batch->qty_left - $deduct;
            $batch->save();

            InventoryMovement::create([
                'product_id' => $productId,
                'batch_id' => $batch->id,
                'type' => InventoryMovement::TYPE_OUT,
                'qty' => $deduct,
                'reason' => 'order',
                'order_id' => $orderId,
                'user_id' => auth()->id(),
            ]);

            $remaining -= $deduct;
        }
    }
}
