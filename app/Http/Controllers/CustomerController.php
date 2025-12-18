<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('customers/index', [
            'customers' => Customer::withCount('orders')->latest()->paginate(15),
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

        $customer = Customer::query()
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
                ...$validated,
                'phone' => $normalizedPhone,
            ]);
        }

        return back()->with('success', 'Клиент добавлен в базу.');
    }
}
