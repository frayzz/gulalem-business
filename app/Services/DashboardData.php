<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ProductBatch;
use Carbon\Carbon;

class DashboardData
{
    /**
     * Build shared data for dashboard-style views.
     */
    public function build(): array
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
            ->where('status', Order::STATUS_DELIVERED)
            ->count();

        $crmSummary = [
            'activeOrders' => Order::whereNotIn('status', [
                Order::STATUS_DELIVERED,
                Order::STATUS_CANCELED,
            ])->count(),
            'upcomingDeliveries' => Order::whereNotNull('delivery_time')
                ->where('delivery_time', '>=', $today->startOfDay())
                ->count(),
            'unpaidTotal' => (float) Order::where('payment_status', '!=', 'paid')
                ->get()
                ->sum(fn (Order $order) => max((float) $order->total - (float) $order->paid_total, 0)),
            'newCustomers' => Customer::where('created_at', '>=', Carbon::now()->subDays(7))->count(),
            'totalCustomers' => Customer::count(),
        ];

        $pipeline = Order::selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->get()
            ->map(fn (Order $order) => [
                'status' => $order->status,
                'total' => (int) $order->total,
            ]);

        $inventoryAlerts = [
            'expiringSoon' => ProductBatch::whereNotNull('expires_at')
                ->whereBetween('expires_at', [$today, (clone $today)->addDays(3)])
                ->count(),
            'lowStock' => ProductBatch::where('qty_left', '<', 5)->count(),
        ];

        return [
            'orders' => $orders,
            'inventory' => $inventory,
            'paymentsToday' => (float) $paymentsToday,
            'ordersToday' => $ordersToday,
            'completedToday' => $completedToday,
            'crmSummary' => $crmSummary,
            'pipeline' => $pipeline,
            'inventoryAlerts' => $inventoryAlerts,
        ];
    }
}
