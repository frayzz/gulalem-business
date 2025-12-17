<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        return Product::query()->orderBy('name')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|string',
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'sku' => 'required|string|max:100|unique:products,sku',
            'default_price' => 'nullable|numeric',
        ]);

        $product = Product::create($data);

        return response()->json($product, 201);
    }

    public function show(Product $product)
    {
        return $product->load('bouquetRecipe.items');
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'type' => 'sometimes|required|string',
            'name' => 'sometimes|required|string|max:255',
            'unit' => 'sometimes|required|string|max:50',
            'sku' => 'sometimes|required|string|max:100|unique:products,sku,' . $product->id,
            'default_price' => 'nullable|numeric',
            'active' => 'boolean',
        ]);

        $product->update($data);

        return $product->fresh();
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->noContent();
    }

    public function deactivate(Product $product)
    {
        $product->update(['active' => false]);

        return $product->fresh();
    }
}
