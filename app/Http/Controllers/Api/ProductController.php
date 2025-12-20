<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\Stores;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function __construct(private Stores $stores)
    {
    }

    public function index()
    {
        return Product::query()
            ->where('shop_id', $this->stores->currentId())
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        $storeId = $this->stores->currentId();

        $data = $request->validate([
            'shop_id' => ['required', 'integer', Rule::in([$storeId])],
            'type' => 'required|string',
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->where(fn ($query) => $query->where('shop_id', $storeId)),
            ],
            'default_price' => 'nullable|numeric',
        ]);

        $data['shop_id'] = $storeId;

        $product = Product::create($data);

        return response()->json($product, 201);
    }

    public function show(Product $product)
    {
        $this->ensureSameStore($product);

        return $product->load('bouquetRecipe.items');
    }

    public function update(Request $request, Product $product)
    {
        $this->ensureSameStore($product);

        $storeId = $this->stores->currentId();

        $data = $request->validate([
            'type' => 'sometimes|required|string',
            'name' => 'sometimes|required|string|max:255',
            'unit' => 'sometimes|required|string|max:50',
            'sku' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'sku')
                    ->where(fn ($query) => $query->where('shop_id', $storeId))
                    ->ignore($product->id),
            ],
            'default_price' => 'nullable|numeric',
            'active' => 'boolean',
        ]);

        $product->update($data);

        return $product->fresh();
    }

    public function destroy(Product $product)
    {
        $this->ensureSameStore($product);

        $product->delete();

        return response()->noContent();
    }

    public function deactivate(Product $product)
    {
        $this->ensureSameStore($product);

        $product->update(['active' => false]);

        return $product->fresh();
    }

    private function ensureSameStore(Product $product): void
    {
        $storeId = $this->stores->currentId();

        abort_if($product->shop_id !== $storeId, 404);
    }
}
