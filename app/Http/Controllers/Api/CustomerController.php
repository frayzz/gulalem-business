<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');

        $query = Customer::query();

        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%");
        }

        return $query->orderByDesc('updated_at')->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email',
            'birthday' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $customer = Customer::create($data);

        return response()->json($customer, 201);
    }

    public function show(Customer $customer)
    {
        return $customer->load('orders');
    }

    public function lookup(Request $request)
    {
        $data = $request->validate([
            'phone' => 'required|string|max:50',
        ]);

        $normalizedPhone = Customer::normalizePhone($data['phone']);

        if (!$normalizedPhone) {
            return response()->json(['message' => 'Не удалось определить номер телефона'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $customer = Customer::query()
            ->where('phone_e164', $normalizedPhone)
            ->with(['orders' => function ($query) {
                $query->latest()->take(5);
            }])
            ->first();

        if (!$customer) {
            return response()->json(['message' => 'Клиент не найден'], Response::HTTP_NOT_FOUND);
        }

        return $customer;
    }

    public function update(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email',
            'birthday' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $customer->update($data);

        return $customer->fresh();
    }
}
