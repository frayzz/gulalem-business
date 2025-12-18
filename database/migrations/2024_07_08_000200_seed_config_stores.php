<?php

use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $defaultStores = config('stores', []);

        foreach ($defaultStores as $storeData) {
            $store = Store::firstOrCreate(
                ['id' => $storeData['id']],
                [
                    'name' => $storeData['name'],
                    'city' => $storeData['city'] ?? null,
                    'status' => $storeData['status'] ?? null,
                ],
            );

            $store->update([
                'name' => $storeData['name'],
                'city' => $storeData['city'] ?? null,
                'status' => $storeData['status'] ?? null,
            ]);
        }

        $userIds = User::pluck('id');

        if ($userIds->isNotEmpty()) {
            Store::all()->each(function (Store $store) use ($userIds): void {
                $store->users()->syncWithoutDetaching($userIds);
            });
        }
    }

    public function down(): void
    {
        // No rollback for seeded data to prevent accidental data loss.
    }
};
