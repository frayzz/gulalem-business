<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class StoreSwitchController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $stores = collect(config('stores', []));

        $validated = $request->validate([
            'store_id' => ['required', 'integer'],
        ]);

        $storeId = $validated['store_id'];

        abort_if(! $stores->firstWhere('id', $storeId), 404);

        $request->session()->put('current_store_id', $storeId);

        return back();
    }
}
