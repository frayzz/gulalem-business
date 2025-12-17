<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashShift;
use Illuminate\Http\Request;

class CashShiftController extends Controller
{
    public function index()
    {
        return CashShift::with('user')->orderByDesc('opened_at')->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'opened_at' => 'required|date',
            'cash_start' => 'nullable|numeric',
        ]);

        $shift = CashShift::create([
            'user_id' => $request->user()->id,
            'opened_at' => $data['opened_at'],
            'cash_start' => $data['cash_start'] ?? 0,
        ]);

        return response()->json($shift->load('user'), 201);
    }

    public function show(CashShift $cashShift)
    {
        return $cashShift->load('user');
    }

    public function update(Request $request, CashShift $cashShift)
    {
        $data = $request->validate([
            'closed_at' => 'nullable|date',
            'cash_end' => 'nullable|numeric',
        ]);

        $cashShift->update($data);

        return $cashShift->fresh()->load('user');
    }
}
