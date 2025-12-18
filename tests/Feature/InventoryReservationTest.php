<?php

namespace Tests\Feature;

use App\Actions\Inventory\InventoryService;
use App\Models\InventoryMovement;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductBatch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryReservationTest extends TestCase
{
    use RefreshDatabase;

    public function test_reserve_and_consume_flow(): void
    {
        $order = Order::factory()->create();
        $product = Product::factory()->create(['type' => Product::TYPE_FLOWER]);
        ProductBatch::factory()->create(['product_id' => $product->id, 'qty_in' => 5, 'qty_left' => 5]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'qty' => 2,
            'price' => 10,
            'discount' => 0,
        ]);

        $service = new InventoryService();
        $service->reserveForOrder($order);

        $this->assertDatabaseHas('inventory_reservations', [
            'order_id' => $order->id,
            'product_id' => $product->id,
            'qty' => 2,
        ]);

        $this->assertDatabaseHas('inventory_movements', [
            'order_id' => $order->id,
            'product_id' => $product->id,
            'type' => InventoryMovement::TYPE_RESERVE,
        ]);

        $service->consumeForOrder($order->fresh());

        $this->assertDatabaseMissing('inventory_reservations', [
            'order_id' => $order->id,
            'product_id' => $product->id,
        ]);

        $this->assertDatabaseHas('inventory_movements', [
            'order_id' => $order->id,
            'product_id' => $product->id,
            'type' => InventoryMovement::TYPE_OUT,
        ]);
    }
}
