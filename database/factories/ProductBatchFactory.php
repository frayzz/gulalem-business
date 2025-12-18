<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductBatch;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductBatchFactory extends Factory
{
    protected $model = ProductBatch::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'supplier_id' => null,
            'buy_price' => 5,
            'qty_in' => 10,
            'qty_left' => 10,
            'arrived_at' => now(),
            'expires_at' => null,
        ];
    }
}
