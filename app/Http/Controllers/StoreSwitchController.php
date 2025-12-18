<?php

namespace App\Http\Controllers;

use App\Services\Stores;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class StoreSwitchController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'store_id' => ['required', 'integer'],
        ]);

        $stores = app(Stores::class);
        $stores->setCurrent($validated['store_id']);

        return back();
    }
}
