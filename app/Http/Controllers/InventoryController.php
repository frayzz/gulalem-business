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
            'recipes' => BouquetRecipe::with(['bouquet', 'items.product'])->latest()->get(),
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
            'components' => ['required', 'array', 'min:1'],
            'components.*.product_name' => ['required', 'string', 'max:255'],
            'components.*.qty' => ['required', 'numeric', 'min:0.1'],
        ]);

        $bouquet = Product::firstOrCreate(
            ['name' => $validated['bouquet_name'], 'type' => Product::TYPE_BOUQUET],
            [
                'unit' => 'шт',
                'sku' => null,
                'active' => true,
                'default_price' => 0,
            ],
        );

        $recipe = BouquetRecipe::firstOrCreate(['bouquet_product_id' => $bouquet->id]);
        $recipe->items()->delete();

        foreach ($validated['components'] as $component) {
            $product = Product::firstOrCreate(
                ['name' => $component['product_name'], 'type' => Product::TYPE_FLOWER],
                [
                    'unit' => 'шт',
                    'sku' => null,
                    'active' => true,
                    'default_price' => 0,
                ],
            );

            BouquetRecipeItem::create([
                'recipe_id' => $recipe->id,
                'product_id' => $product->id,
                'qty' => $component['qty'],
            ]);
        }

        return back()->with('success', 'Рецепт букета сохранён.');
    }
}
