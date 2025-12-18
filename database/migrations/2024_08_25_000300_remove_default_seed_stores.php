<?php

use App\Models\Store;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Remove placeholder stores that were previously seeded from config/stores.php.
     */
    public function up(): void
    {
        $placeholderStoreNames = [
            'Цветы на Петроградке',
            'Цветы на Невском',
            'Пункт выдачи на Васильевском',
        ];

        Store::whereIn('name', $placeholderStoreNames)->each(function (Store $store): void {
            $store->users()->detach();
            $store->delete();
        });
    }

    public function down(): void
    {
        // No rollback to avoid resurrecting placeholder data.
    }
};
