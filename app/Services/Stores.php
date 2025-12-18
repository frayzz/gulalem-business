<?php

namespace App\Services;

use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class Stores
{
    private const SESSION_KEY = 'current_store_id';

    public function __construct(private readonly Request $request)
    {
    }

    /**
     * Get all available stores for current user.
     *
     * @return Collection<int, Store>
     */
    public function all(): Collection
    {
        $user = $this->request->user();

        if ($user) {
            return $user->accessibleStores();
        }

        return Store::query()->orderBy('name')->get();
    }

    /**
     * Set current store in session if it exists.
     */
    public function setCurrent(int $storeId): void
    {
        $store = $this->find($storeId);

        abort_if(! $store, 404);

        $this->request->session()->put(self::SESSION_KEY, $store->id);
    }

    /**
     * Get current store identifier, falling back to the first available store.
     */
    public function currentId(): ?int
    {
        $storeId = $this->request->session()->get(self::SESSION_KEY);

        if ($this->find($storeId)) {
            return $storeId;
        }

        $defaultStoreId = $this->all()->first()['id'] ?? null;

        if ($defaultStoreId) {
            $this->request->session()->put(self::SESSION_KEY, $defaultStoreId);
        }

        return $defaultStoreId;
    }

    /**
     * Get the current store data.
     */
    public function current(): ?Store
    {
        $storeId = $this->currentId();

        return $storeId ? $this->find($storeId) : null;
    }

    private function find(?int $storeId): ?Store
    {
        if (! $storeId) {
            return null;
        }

        return $this->all()->firstWhere('id', $storeId);
    }
}
