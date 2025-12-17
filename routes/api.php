<?php

use App\Http\Controllers\Api\BouquetRecipeController;
use App\Http\Controllers\Api\CashShiftController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductBatchController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('products', ProductController::class);
    Route::post('products/{product}/deactivate', [ProductController::class, 'deactivate']);

    Route::apiResource('customers', CustomerController::class)->only(['index', 'store', 'update', 'show']);

    Route::apiResource('product-batches', ProductBatchController::class)->only(['index', 'store']);

    Route::post('inventory/intake', [InventoryController::class, 'intake']);
    Route::post('inventory/write-off', [InventoryController::class, 'writeOff']);
    Route::post('inventory/adjust', [InventoryController::class, 'adjust']);

    Route::apiResource('bouquets', BouquetRecipeController::class)->only(['store', 'update', 'show']);

    Route::apiResource('orders', OrderController::class)->only(['index', 'store', 'show']);
    Route::post('orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::post('orders/{order}/pay', [OrderController::class, 'pay']);

    Route::apiResource('cash-shifts', CashShiftController::class)->only(['index', 'store', 'update', 'show']);
});
