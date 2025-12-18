<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_status_transitions_based_on_paid_amount(): void
    {
        $order = Order::factory()->create([
            'total' => 100,
            'payment_status' => 'unpaid',
        ]);

        $service = new PaymentService();
        $service->refreshStatus($order);

        $this->assertSame('unpaid', $order->fresh()->payment_status);

        $service->registerPayment(['order_id' => $order->id, 'method' => 'cash', 'amount' => 50]);
        $this->assertSame('partially_paid', $order->fresh()->payment_status);

        $service->registerPayment(['order_id' => $order->id, 'method' => 'cash', 'amount' => 50]);
        $this->assertSame('paid', $order->fresh()->payment_status);
    }
}
