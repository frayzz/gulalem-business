<?php

use App\Http\Controllers\CashDeskController;
use App\Http\Controllers\Api\CustomerController as ApiCustomerController;
use App\Http\Controllers\Api\OrderController as ApiOrderController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\OrderController;
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
    Route::get('reports', ReportsController::class)->name('reports');

    Route::get('cash-desk', [CashDeskController::class, 'index'])->name('cash-desk.index');
    Route::post('cash-desk/payments', [CashDeskController::class, 'store'])->name('cash-desk.payments.store');

    Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::post('customers', [CustomerController::class, 'store'])->name('customers.store');
    Route::get('customers/lookup', [ApiCustomerController::class, 'lookup'])->name('customers.lookup');

    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('orders/create', [OrderController::class, 'create'])->name('orders.create');
    Route::post('orders', [OrderController::class, 'store'])->name('orders.store');
    Route::post('orders/{order}/status', [ApiOrderController::class, 'updateStatus'])->name('orders.status');

    Route::get('inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('inventory', [InventoryController::class, 'store'])->name('inventory.store');
    Route::post('inventory/recipes', [InventoryController::class, 'storeRecipe'])->name('inventory.recipes.store');

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
