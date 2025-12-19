<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Services\Stores;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function __construct(private Stores $stores)
    {
    }

    public function index(): Response
    {
        return Inertia::render('customers/index', [
            'customers' => Customer::withCount('orders')
                ->where('shop_id', $this->stores->currentId())
                ->latest()
                ->paginate(15),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'birthday' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $normalizedPhone = Customer::normalizePhone($validated['phone'] ?? null);
        $storeId = $this->stores->currentId();

        $customer = Customer::query()
            ->where('shop_id', $storeId)
            ->when($normalizedPhone, fn ($query) => $query->where('phone', $normalizedPhone))
            ->first();

        if ($customer) {
            $customer->fill([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? $customer->email,
                'birthday' => $validated['birthday'] ?? $customer->birthday,
                'notes' => $validated['notes'] ?? $customer->notes,
                'phone' => $normalizedPhone,
            ])->save();
        } else {
            Customer::create([
                'shop_id' => $storeId,
                ...$validated,
                'phone' => $normalizedPhone,
            ]);
        }

        return back()->with('success', 'Клиент добавлен в базу.');
    }
}
