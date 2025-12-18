<?php

namespace App\Http\Controllers;

use App\Models\BouquetRecipe;
use App\Models\BouquetRecipeItem;
use App\Models\Product;
use App\Models\ProductBatch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('inventory/index', [
            'batches' => ProductBatch::with('product')->latest('arrived_at')->paginate(15),
            'recipes' => BouquetRecipe::with(['bouquet', 'items.product'])
                ->latest()
                ->get()
                ->map(fn (BouquetRecipe $recipe) => [
                    'id' => $recipe->id,
                    'bouquet' => $recipe->bouquet?->only(['id', 'name']),
                    'items' => $recipe->items->map(fn (BouquetRecipeItem $item) => [
                        'id' => $item->id,
                        'qty' => (string) $item->qty,
                        'product' => $item->product?->only(['id', 'name']),
                    ]),
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_name' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'numeric', 'min:1'],
            'arrived_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:arrived_at'],
        ]);

        $product = Product::firstOrCreate(
            ['name' => $validated['product_name']],
            [
                'type' => Product::TYPE_FLOWER,
                'unit' => 'шт',
                'sku' => null,
                'active' => true,
                'default_price' => 0,
            ],
        );

        ProductBatch::create([
            'product_id' => $product->id,
            'supplier_id' => null,
            'buy_price' => 0,
            'qty_in' => $validated['quantity'],
            'qty_left' => $validated['quantity'],
            'arrived_at' => $validated['arrived_at'],
            'expires_at' => $validated['expires_at'],
        ]);

        return back()->with('success', 'Партия добавлена на склад.');
    }

    public function storeRecipe(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'bouquet_name' => ['required', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.qty' => ['required', 'numeric', 'min:0.001'],
        ]);

        $bouquet = Product::firstOrCreate(
            ['name' => $validated['bouquet_name']],
            [
                'type' => Product::TYPE_BOUQUET,
                'unit' => 'шт',
                'active' => true,
                'sku' => null,
                'default_price' => 0,
            ],
        );

        $recipe = BouquetRecipe::firstOrCreate([
            'bouquet_product_id' => $bouquet->id,
        ]);

        $recipe->items()->delete();

        foreach ($validated['items'] as $item) {
            $component = Product::firstOrCreate(
                ['name' => $item['name']],
                [
                    'type' => Product::TYPE_MATERIAL,
                    'unit' => 'шт',
                    'active' => true,
                    'sku' => null,
                    'default_price' => 0,
                ],
            );

            $recipe->items()->create([
                'product_id' => $component->id,
                'qty' => $item['qty'],
            ]);
        }

        return back()->with('success', 'Рецепт букета сохранён.');
    }
}
