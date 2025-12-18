<?php

namespace App\Http\Controllers\Api;

use App\Actions\Inventory\InventoryService;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class OrderController extends Controller
{
    public function __construct(private InventoryService $inventory, private PaymentService $paymentService)
    {
    }

    public function index(Request $request)
    {
        $status = $request->query('status');

        $query = Order::with(['customer', 'items.product', 'payments'])->orderByDesc('created_at');

        if ($status) {
            $query->where('status', $status);
        }

        return $query->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'status' => ['nullable', Rule::in(Order::STATUSES)],
            'delivery_type' => 'required|string',
            'delivery_address' => 'nullable|string',
            'delivery_time' => 'nullable|date',
            'discount' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|numeric|min:0.001',
            'items.*.price' => 'required|numeric',
            'items.*.discount' => 'nullable|numeric',
            'payments' => 'nullable|array',
            'payments.*.method' => 'required_with:payments|string',
            'payments.*.amount' => 'required_with:payments|numeric',
        ]);

        $order = DB::transaction(function () use ($data) {
            $order = Order::create([
                'customer_id' => $data['customer_id'] ?? null,
                'status' => $data['status'] ?? Order::STATUS_DRAFT,
                'delivery_type' => $data['delivery_type'],
                'delivery_address' => $data['delivery_address'] ?? null,
                'delivery_time' => $data['delivery_time'] ?? null,
                'discount' => $data['discount'] ?? 0,
                'payment_status' => PaymentService::STATUS_UNPAID,
            ]);

            $total = 0;
            foreach ($data['items'] as $item) {
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
                'paid_total' => 0,
            ]);

            $this->handleInventoryState($order, null, $order->status);

            if (!empty($data['payments'])) {
                $this->recordPayments($order, $data['payments']);
            } else {
                $this->paymentService->refreshStatus($order);
            }

            return $order->load(['items.product', 'payments']);
        });

        return response()->json($order, Response::HTTP_CREATED);
    }

    public function show(Order $order)
    {
        return $order->load(['items.product', 'payments', 'customer']);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(Order::STATUSES)],
        ]);

        DB::transaction(function () use ($order, $data) {
            $oldStatus = $order->status;
            $order->update(['status' => $data['status']]);
            $this->handleInventoryState($order, $oldStatus, $data['status']);
        });

        $order->refresh()->load(['items.product', 'payments']);

        if ($request->expectsJson()) {
            return $order;
        }

        return back()->with('success', 'Статус заказа обновлён');
    }

    public function pay(Request $request, Order $order)
    {
        $data = $request->validate([
            'payments' => 'required|array|min:1',
            'payments.*.method' => 'required|string',
            'payments.*.amount' => 'required|numeric',
        ]);

        $this->recordPayments($order, $data['payments']);

        return $order->refresh()->load('payments');
    }

    protected function recordPayments(Order $order, array $payments): void
    {
        foreach ($payments as $payment) {
            $this->paymentService->registerPayment([
                'order_id' => $order->id,
                'method' => $payment['method'],
                'amount' => $payment['amount'],
            ]);
        }
    }

    protected function handleInventoryState(Order $order, ?string $oldStatus, string $newStatus): void
    {
        if ($newStatus !== Order::STATUS_CANCELED) {
            $this->inventory->assertAvailabilityForOrder($order);
        }

        if ($oldStatus === null && $newStatus !== Order::STATUS_CANCELED) {
            $this->inventory->reserveForOrder($order);
            return;
        }

        if ($newStatus === Order::STATUS_CANCELED && $oldStatus !== Order::STATUS_CANCELED) {
            $this->inventory->releaseReservation($order);
            return;
        }

        if ($newStatus === Order::STATUS_CONFIRMED && $oldStatus !== Order::STATUS_CONFIRMED) {
            $this->inventory->reserveForOrder($order);
            return;
        }

        $consumableStatuses = [
            Order::STATUS_IN_ASSEMBLY,
            Order::STATUS_READY,
            Order::STATUS_DELIVERED,
        ];

        if (in_array($newStatus, $consumableStatuses, true) && !in_array($oldStatus, $consumableStatuses, true)) {
            $this->inventory->consumeForOrder($order);
        }
    }
}
