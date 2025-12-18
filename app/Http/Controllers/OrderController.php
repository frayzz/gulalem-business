<?php

namespace App\Http\Controllers;

use App\Actions\Inventory\InventoryService;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(private InventoryService $inventory)
    {
    }

    public function index(): Response
    {
        return Inertia::render('orders/index', [
            'orders' => Order::with(['customer', 'payments'])->latest()->paginate(15),
            'products' => Product::with(['bouquetRecipe.items.product'])
                ->orderBy('name')
                ->get()
                ->map(function (Product $product) {
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'type' => $product->type,
                        'unit' => $product->unit,
                        'default_price' => $product->default_price,
                        'available_qty' => $this->inventory->getAvailableQty($product),
                        'bouquet_recipe' => $product->bouquetRecipe ? [
                            'items' => $product->bouquetRecipe->items->map(fn ($item) => [
                                'id' => $item->id,
                                'qty' => $item->qty,
                                'product' => $item->product?->only(['id', 'name', 'unit']),
                            ]),
                        ] : null,
                    ];
                }),
        ]);
    }

    public function create(): RedirectResponse
    {
        return redirect()->route('orders.index');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_name' => ['nullable', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:255'],
            'delivery_type' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.qty' => ['required', 'numeric', 'min:0.001'],
            'items.*.price' => ['required', 'numeric', 'min:0'],
            'items.*.discount' => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($validated) {
            $customer = $this->findOrCreateCustomer(
                $validated['customer_name'] ?? null,
                $validated['customer_phone'] ?? null
            );

            /** @var Order $order */
            $order = Order::create([
                'customer_id' => $customer?->id,
                'status' => Order::STATUS_DRAFT,
                'delivery_type' => $validated['delivery_type'],
                'delivery_address' => null,
                'delivery_time' => null,
                'discount' => 0,
                'paid_total' => 0,
                'payment_status' => PaymentService::STATUS_UNPAID,
                'notes' => $validated['notes'] ?? null,
            ]);

            $total = 0;

            foreach ($validated['items'] as $item) {
                $lineTotal = ($item['price'] * $item['qty']) - ($item['discount'] ?? 0);
                $total += $lineTotal;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'qty' => $item['qty'],
                    'price' => $item['price'],
                    'discount' => $item['discount'] ?? 0,
                ]);
            }

            $order->update([
                'total' => $total,
            ]);

            $this->inventory->assertAvailabilityForOrder($order);
            $this->inventory->reserveForOrder($order);
        });

        return back()->with('success', 'Заказ создан, зарезервирован и добавлен в очередь.');
    }

    private function findOrCreateCustomer(?string $name, ?string $phone): ?Customer
    {
        if (!$name && !$phone) {
            return null;
        }

        $normalizedPhone = Customer::normalizePhone($phone);

        $customer = Customer::query()
            ->when($normalizedPhone, fn ($query) => $query->where('phone_e164', $normalizedPhone))
            ->first();

        if ($customer) {
            $customer->update([
                'name' => $customer->name ?: $name,
                'phone' => $normalizedPhone,
            ]);

            return $customer;
        }

        return Customer::create([
            'name' => $name,
            'phone' => $normalizedPhone,
        ]);
    }
}
