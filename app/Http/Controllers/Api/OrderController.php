<?php

namespace App\Http\Controllers\Api;

use App\Actions\Inventory\InventoryService;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class OrderController extends Controller
{
    public function __construct(private InventoryService $inventory)
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
            'status' => 'nullable|string',
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
                'status' => $data['status'] ?? Order::STATUS_NEW,
                'delivery_type' => $data['delivery_type'],
                'delivery_address' => $data['delivery_address'] ?? null,
                'delivery_time' => $data['delivery_time'] ?? null,
                'discount' => $data['discount'] ?? 0,
                'payment_status' => 'pending',
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

            if (!empty($data['payments'])) {
                $this->recordPayments($order, $data['payments']);
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
            'status' => 'required|string',
        ]);

        $order->update(['status' => $data['status']]);

        if ($data['status'] === Order::STATUS_COMPLETED) {
            $this->inventory->consumeForOrder($order);
        }

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
        $paidTotal = $order->paid_total;

        foreach ($payments as $payment) {
            Payment::create([
                'order_id' => $order->id,
                'method' => $payment['method'],
                'amount' => $payment['amount'],
            ]);
            $paidTotal += $payment['amount'];
        }

        $paymentStatus = 'pending';

        if ($paidTotal >= $order->total) {
            $paymentStatus = 'paid';
        } elseif ($paidTotal > 0) {
            $paymentStatus = 'partial';
        }

        $order->update([
            'paid_total' => $paidTotal,
            'payment_status' => $paymentStatus,
        ]);
    }
}
