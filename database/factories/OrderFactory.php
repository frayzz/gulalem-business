<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'customer_id' => null,
            'status' => Order::STATUS_DRAFT,
            'delivery_type' => 'pickup',
            'delivery_address' => null,
            'delivery_time' => now(),
            'total' => 100,
            'discount' => 0,
            'paid_total' => 0,
            'payment_status' => 'unpaid',
            'notes' => null,
        ];
    }
}
