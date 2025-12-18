<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    public function index(): Response
    {
        $stores = Store::with('users:id,name,email')
            ->orderBy('name')
            ->get();

        $users = User::query()
            ->select(['id', 'name', 'email'])
            ->orderBy('name')
            ->get();

        return Inertia::render('settings/stores', [
            'stores' => $stores,
            'users' => $users,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
        ]);

        $store = Store::create($validated);

        if ($request->user()) {
            $store->users()->syncWithoutDetaching([$request->user()->id]);
        }

        return back()->with('success', 'Магазин создан');
    }

    public function syncUsers(Request $request, Store $store): RedirectResponse
    {
        $validated = $request->validate([
            'user_ids' => ['array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $store->users()->sync($validated['user_ids'] ?? []);

        return back()->with('success', 'Доступы обновлены');
    }
}
