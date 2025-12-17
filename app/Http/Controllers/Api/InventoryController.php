<?php

namespace App\Http\Controllers\Api;

use App\Actions\Inventory\InventoryService;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class InventoryController extends Controller
{
    public function __construct(private InventoryService $inventory)
    {
    }

    public function intake(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'buy_price' => 'required|numeric',
            'qty' => 'required|numeric|min:0.001',
            'arrived_at' => 'required|date',
            'expires_at' => 'nullable|date',
            'reason' => 'nullable|string',
        ]);

        $batch = $this->inventory->intake([
            ...$data,
            'user_id' => $request->user()?->id,
        ]);

        return response()->json($batch->load(['product', 'supplier']), 201);
    }

    public function writeOff(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'qty' => 'required|numeric|min:0.001',
            'reason' => 'nullable|string',
        ]);

        $product = Product::findOrFail($data['product_id']);

        $this->inventory->writeOff($product, $data['qty'], null, $data['reason'] ?? 'manual-write-off', $request->user()?->id);

        return response()->json(['status' => 'ok']);
    }

    public function adjust(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'batch_id' => 'nullable|exists:product_batches,id',
            'qty' => 'required|numeric',
            'reason' => 'nullable|string',
        ]);

        $product = Product::findOrFail($data['product_id']);

        $movement = $this->inventory->adjust($product, $data['qty'], $data['batch_id'] ?? null, $data['reason'] ?? 'adjust', $request->user()?->id);

        return response()->json($movement, 201);
    }
}
