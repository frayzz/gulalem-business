<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Models\ProductBatch;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $orders = Order::with('customer')
            ->latest()
            ->take(8)
            ->get()
            ->map(function (Order $order) {
                return [
                    'id' => $order->id,
                    'customer' => $order->customer?->name,
                    'total' => (float) $order->total,
                    'status' => $order->status,
                    'delivery_type' => $order->delivery_type,
                    'payment_status' => $order->payment_status,
                    'paid_total' => (float) $order->paid_total,
                    'notes' => $order->notes,
                    'created_at' => $order->created_at,
                    'delivery_time' => $order->delivery_time,
                ];
            });

        $inventory = ProductBatch::with('product')
            ->orderBy('expires_at')
            ->orderByDesc('arrived_at')
            ->take(8)
            ->get()
            ->map(function (ProductBatch $batch) {
                return [
                    'id' => $batch->id,
                    'product' => $batch->product?->name,
                    'qty_left' => (float) $batch->qty_left,
                    'expires_at' => $batch->expires_at,
                    'arrived_at' => $batch->arrived_at,
                ];
            });

        $today = Carbon::today();

        $paymentsToday = Payment::whereDate('created_at', $today)->sum('amount');
        $ordersToday = Order::whereDate('created_at', $today)->count();
        $completedToday = Order::whereDate('created_at', $today)
            ->where('status', Order::STATUS_COMPLETED)
            ->count();

        return Inertia::render('dashboard', [
            'orders' => $orders,
            'inventory' => $inventory,
            'paymentsToday' => (float) $paymentsToday,
            'ordersToday' => $ordersToday,
            'completedToday' => $completedToday,
        ]);
    }
}
