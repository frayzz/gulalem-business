<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('shops') && Schema::hasTable('stores')) {
            Schema::rename('stores', 'shops');
        }

        if (! Schema::hasTable('shops')) {
            Schema::create('shops', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->string('city')->nullable();
                $table->string('status')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('shop_user')) {
            Schema::create('shop_user', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->timestamps();
                $table->unique(['shop_id', 'user_id']);
            });
        }

        if (Schema::hasTable('stores') && Schema::hasTable('shops') && Schema::hasColumn('stores', 'name')) {
            $existingShopIds = DB::table('shops')->pluck('id')->all();

            DB::table('stores')->orderBy('id')->each(function ($store) use ($existingShopIds): void {
                if (in_array($store->id, $existingShopIds, true)) {
                    return;
                }

                DB::table('shops')->insert([
                    'id' => $store->id,
                    'name' => $store->name,
                    'city' => $store->city,
                    'status' => $store->status,
                    'created_at' => $store->created_at,
                    'updated_at' => $store->updated_at,
                ]);
            });
        }

        if (Schema::hasTable('store_user') && Schema::hasTable('shop_user')) {
            DB::table('store_user')->orderBy('id')->each(function ($pivot): void {
                DB::table('shop_user')->updateOrInsert(
                    ['shop_id' => $pivot->store_id, 'user_id' => $pivot->user_id],
                    ['created_at' => $pivot->created_at, 'updated_at' => $pivot->updated_at]
                );
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_user');
        Schema::dropIfExists('shops');
    }
};
