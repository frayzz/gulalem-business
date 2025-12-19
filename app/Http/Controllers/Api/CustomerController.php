<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\Stores;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CustomerController extends Controller
{
    public function __construct(private Stores $stores)
    {
    }

    public function index(Request $request)
    {
        $search = $request->query('search');
        $storeId = $this->stores->currentId();

        $query = Customer::query()->where('shop_id', $storeId);

        if ($search) {
            $normalizedSearch = Customer::normalizePhone($search);

            $query->where(function ($query) use ($search, $normalizedSearch) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");

                if ($normalizedSearch) {
                    $query->orWhere('phone_e164', 'like', "%{$normalizedSearch}%");
                }
            });
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
        $data['shop_id'] = $this->stores->currentId();

        $customer = Customer::create($data);

        return response()->json($customer, 201);
    }

    public function show(Customer $customer)
    {
        $this->ensureSameStore($customer);

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
            ->where('shop_id', $this->stores->currentId())
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
        $this->ensureSameStore($customer);

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

    private function ensureSameStore(Customer $customer): void
    {
        $storeId = $this->stores->currentId();

        abort_if($customer->shop_id && $customer->shop_id !== $storeId, 404);
    }
}
