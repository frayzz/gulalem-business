<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'type' => Product::TYPE_FLOWER,
            'name' => $this->faker->word(),
            'unit' => 'pcs',
            'sku' => $this->faker->unique()->lexify('SKU??????'),
            'active' => true,
            'default_price' => 10,
        ];
    }
}
