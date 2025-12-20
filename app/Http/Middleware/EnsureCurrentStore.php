<?php

namespace App\Http\Middleware;

use App\Services\Stores;
use Closure;
use Illuminate\Http\Request;

class EnsureCurrentStore
{
    /**
     * Resolve and validate the current store selection for the request.
     */
    public function handle(Request $request, Closure $next)
    {
        $stores = app(Stores::class);
        $availableStores = $stores->all();

        $sessionStoreId = $request->session()->get('current_store_id');
        $currentStore = null;

        if ($sessionStoreId) {
            $currentStore = $availableStores->firstWhere('id', $sessionStoreId);

            abort_if(! $currentStore, 403, 'Access denied to the selected store.');
        } else {
            $currentStore = $availableStores->first();
        }

        $currentStoreId = $currentStore?->id;

        if ($currentStoreId) {
            $request->session()->put('current_store_id', $currentStoreId);
        }

        $request->attributes->set('currentStoreId', $currentStoreId);
        $request->attributes->set('currentStore', $currentStore);

        app()->instance('currentStoreId', $currentStoreId);
        app()->instance('currentStore', $currentStore);

        return $next($request);
    }
}
