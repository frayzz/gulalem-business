<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BouquetRecipe;
use App\Models\BouquetRecipeItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BouquetRecipeController extends Controller
{
    public function store(Request $request)
    {
        $data = $this->validatePayload($request);

        $product = Product::findOrFail($data['bouquet_product_id']);

        $recipe = DB::transaction(function () use ($data) {
            $recipe = BouquetRecipe::create([
                'bouquet_product_id' => $data['bouquet_product_id'],
            ]);

            $this->syncItems($recipe, $data['items']);

            return $recipe;
        });

        return response()->json($recipe->load('items.product'), 201);
    }

    public function show(BouquetRecipe $bouquet)
    {
        return $bouquet->load('items.product');
    }

    public function update(Request $request, BouquetRecipe $bouquet)
    {
        $data = $this->validatePayload($request);

        DB::transaction(function () use ($bouquet, $data) {
            $bouquet->update(['bouquet_product_id' => $data['bouquet_product_id']]);
            $this->syncItems($bouquet, $data['items']);
        });

        return $bouquet->load('items.product');
    }

    protected function validatePayload(Request $request): array
    {
        return $request->validate([
            'bouquet_product_id' => 'required|exists:products,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|numeric|min:0.001',
        ]);
    }

    protected function syncItems(BouquetRecipe $recipe, array $items): void
    {
        $recipe->items()->delete();

        foreach ($items as $item) {
            BouquetRecipeItem::create([
                'recipe_id' => $recipe->id,
                'product_id' => $item['product_id'],
                'qty' => $item['qty'],
            ]);
        }
    }
}
