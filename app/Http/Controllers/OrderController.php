<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('orders/index', [
            'orders' => Order::with(['customer', 'payments'])->latest()->paginate(15),
            'bouquets' => Product::where('type', Product::TYPE_BOUQUET)
                ->with(['bouquetRecipe.items.product'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_name' => ['nullable', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:255'],
            'delivery_type' => ['required', 'string', 'max:255'],
            'total' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
            'bouquet_product_id' => ['nullable', 'integer', 'exists:products,id'],
            'quantity' => ['nullable', 'numeric', 'min:1'],
        ]);

        $customer = null;

        if ($validated['customer_name'] || $validated['customer_phone']) {
            $customer = Customer::create([
                'name' => $validated['customer_name'],
                'phone' => $validated['customer_phone'],
            ]);
        }

        $order = Order::create([
            'customer_id' => $customer?->id,
            'status' => Order::STATUS_NEW,
            'delivery_type' => $validated['delivery_type'],
            'delivery_address' => null,
            'delivery_time' => null,
            'total' => $validated['total'],
            'discount' => 0,
            'paid_total' => 0,
            'payment_status' => 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        if ($validated['bouquet_product_id'] && $validated['quantity']) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $validated['bouquet_product_id'],
                'qty' => $validated['quantity'],
                'price' => 0,
                'discount' => 0,
            ]);
        }

        return back()->with('success', 'Заказ создан и добавлен в очередь.');
    }

    public function updateStatus(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', [
                Order::STATUS_NEW,
                Order::STATUS_IN_PROGRESS,
                Order::STATUS_READY,
                Order::STATUS_DELIVERED,
                Order::STATUS_COMPLETED,
                Order::STATUS_CANCELLED,
            ])],
        ]);

        $order->update(['status' => $validated['status']]);

        return back()->with('success', 'Статус заказа обновлён.');
    }
}
