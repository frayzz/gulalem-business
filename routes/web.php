<?php

use App\Http\Controllers\DashboardController;
use App\Models\Order;
use App\Models\ProductBatch;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('orders', function () {
        return Inertia::render('orders/index', [
            'orders' => Order::with(['customer', 'payments'])->latest()->paginate(15),
        ]);
    })->name('orders.index');

    Route::get('inventory', function () {
        return Inertia::render('inventory/index', [
            'batches' => ProductBatch::with('product')->latest('arrived_at')->paginate(15),
        ]);
    })->name('inventory.index');

    Route::get('comments', function () {
        return Inertia::render('comments/index', [
            'comments' => Order::whereNotNull('notes')
                ->where('notes', '!=', '')
                ->with('customer')
                ->latest()
                ->paginate(15),
        ]);
    })->name('comments.index');
});

require __DIR__.'/settings.php';
