<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Services\PaymentService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CashDeskController extends Controller
{
    public function index(): Response
    {
        $today = Carbon::today();

        $payments = Payment::with('order')->latest()->take(12)->get()->map(function (Payment $payment) {
            return [
                'id' => $payment->id,
                'method' => $payment->method,
                'amount' => (float) $payment->amount,
                'order_id' => $payment->order_id,
                'created_at' => $payment->created_at,
            ];
        });

        $methodTotals = Payment::selectRaw('method, SUM(amount) as total')
            ->groupBy('method')
            ->pluck('total', 'method');

        $paymentsToday = Payment::whereDate('created_at', $today)->sum('amount');

        $openOrders = Order::where('payment_status', '!=', 'paid')
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
            'order_id' => $validated['order_id'] ?? null,
            'method' => $validated['method'],
            'amount' => $validated['amount'],
        ]);

        return back()->with('success', 'Оплата проведена через кассу.');
    }
}
