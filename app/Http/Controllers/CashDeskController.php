<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Services\PaymentService;
use App\Services\Stores;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CashDeskController extends Controller
{
    public function __construct(private Stores $stores)
    {
    }

    public function index(): Response
    {
        $today = Carbon::today();
        $storeId = $this->stores->currentId();

        $payments = Payment::with('order')
            ->where('shop_id', $storeId)
            ->latest()
            ->take(12)
            ->get()
            ->map(function (Payment $payment) {
            return [
                'id' => $payment->id,
                'method' => $payment->method,
                'amount' => (float) $payment->amount,
                'order_id' => $payment->order_id,
                'created_at' => $payment->created_at,
            ];
        });

        $methodTotals = Payment::selectRaw('method, SUM(amount) as total')
            ->where('shop_id', $storeId)
            ->groupBy('method')
            ->pluck('total', 'method');

        $paymentsToday = Payment::where('shop_id', $storeId)
            ->whereDate('created_at', $today)
            ->sum('amount');

        $openOrders = Order::where('shop_id', $storeId)
            ->where('payment_status', '!=', 'paid')
            ->latest()
            ->take(6)
            ->get(['id', 'total', 'paid_total', 'payment_status']);

        return Inertia::render('cash-desk/index', [
            'payments' => $payments,
            'methodTotals' => $methodTotals,
            'paymentsToday' => (float) $paymentsToday,
            'openOrders' => $openOrders,
        ]);
    }

    public function store(Request $request, PaymentService $paymentService): RedirectResponse
    {
        $validated = $request->validate([
            'method' => ['required', 'string', 'max:50'],
            'amount' => ['required', 'numeric', 'min:1'],
            'order_id' => ['nullable', 'integer', 'exists:orders,id'],
        ]);

        $paymentService->registerPayment([
            'shop_id' => $this->stores->currentId(),
            'order_id' => $validated['order_id'] ?? null,
            'method' => $validated['method'],
            'amount' => $validated['amount'],
        ]);

        return back()->with('success', 'Оплата проведена через кассу.');
    }
}
