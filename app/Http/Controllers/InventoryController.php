<?php

namespace App\Http\Controllers;

use App\Actions\Inventory\InventoryService;
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
    public function __construct(private InventoryService $inventory)
    {
    }

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
            'products' => Product::whereIn('type', [Product::TYPE_FLOWER, Product::TYPE_MATERIAL])
                ->orderBy('name')
                ->get()
                ->map(fn (Product $product) => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'unit' => $product->unit,
                    'available_qty' => $this->inventory->getAvailableQty($product),
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_name' => ['required', 'string', 'max:255'],
            'product_price' => ['required', 'numeric', 'min:0'],
            'buy_price' => ['required', 'numeric', 'min:0'],
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
                'default_price' => $validated['product_price'],
            ],
        );

        if ($product->default_price !== $validated['product_price']) {
            $product->update(['default_price' => $validated['product_price']]);
        }

        ProductBatch::create([
            'product_id' => $product->id,
            'supplier_id' => null,
            'buy_price' => $validated['buy_price'],
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
            'bouquet_price' => ['required', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.qty' => ['required', 'numeric', 'min:0.001'],
        ]);

        $bouquet = Product::firstOrCreate(
            ['name' => $validated['bouquet_name']],
            [
                'type' => Product::TYPE_BOUQUET,
                'unit' => 'шт',
                'active' => true,
                'sku' => null,
                'default_price' => $validated['bouquet_price'],
            ],
        );

        if ($bouquet->default_price !== $validated['bouquet_price']) {
            $bouquet->update(['default_price' => $validated['bouquet_price']]);
        }

        $recipe = BouquetRecipe::firstOrCreate([
            'bouquet_product_id' => $bouquet->id,
        ]);

        $recipe->items()->delete();

        foreach ($validated['items'] as $item) {
            /** @var Product|null $component */
            $component = Product::find($item['product_id']);

            if (!$component || $component->type === Product::TYPE_BOUQUET) {
                return back()->withErrors(['items' => 'Компоненты букета должны быть выбраны из склада.']);
            }

            $recipe->items()->create([
                'product_id' => $component->id,
                'qty' => $item['qty'],
            ]);
        }

        return back()->with('success', 'Рецепт букета сохранён.');
    }
}
