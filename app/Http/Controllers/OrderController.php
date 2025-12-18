<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Order;
use App\Services\PaymentService;
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
            'total' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $customer = null;

        if ($validated['customer_name'] || $validated['customer_phone']) {
            $normalizedPhone = Customer::normalizePhone($validated['customer_phone']);

            $customer = Customer::query()
                ->when($normalizedPhone, fn ($query) => $query->where('phone_e164', $normalizedPhone))
                ->first();

            if ($customer) {
                $customer->update([
                    'name' => $customer->name ?: $validated['customer_name'],
                    'phone' => $normalizedPhone,
                ]);
            } else {
                $customer = Customer::create([
                    'name' => $validated['customer_name'],
                    'phone' => $normalizedPhone,
                ]);
            }
        }

        Order::create([
            'customer_id' => $customer?->id,
            'status' => Order::STATUS_DRAFT,
            'delivery_type' => $validated['delivery_type'],
            'delivery_address' => null,
            'delivery_time' => null,
            'total' => $validated['total'],
            'discount' => 0,
            'paid_total' => 0,
            'payment_status' => 'unpaid',
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'Заказ создан и добавлен в очередь.');
    }
}
