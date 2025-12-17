<?php

namespace App\Http\Controllers\Api;

use App\Actions\Inventory\InventoryService;
use App\Http\Controllers\Controller;
use App\Models\ProductBatch;
use Illuminate\Http\Request;

class ProductBatchController extends Controller
{
    public function __construct(private InventoryService $inventory)
    {
    }

    public function index()
    {
        return ProductBatch::with(['product', 'supplier'])->orderByDesc('arrived_at')->paginate(20);
    }

    public function store(Request $request)
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
}
