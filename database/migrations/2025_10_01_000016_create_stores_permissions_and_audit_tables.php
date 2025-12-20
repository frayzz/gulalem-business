<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('stores')) {
            Schema::create('stores', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->string('city')->nullable();
                $table->string('status')->default('active');
                $table->json('metadata')->nullable();
                $table->timestamps();
            });

            if (Schema::hasTable('shops')) {
                DB::table('shops')->orderBy('id')->each(function ($shop): void {
                    DB::table('stores')->insert([
                        'id' => $shop->id,
                        'name' => $shop->name,
                        'city' => $shop->city,
                        'status' => $shop->status ?? 'active',
                        'metadata' => null,
                        'created_at' => $shop->created_at,
                        'updated_at' => $shop->updated_at,
                    ]);
                });
            }
        }

        if (! Schema::hasTable('user_store')) {
            Schema::create('user_store', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
                $table->string('role_in_store')->nullable();
                $table->string('status')->default('active');
                $table->timestamp('assigned_at')->nullable();
                $table->timestamp('ended_at')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();
                $table->unique(['user_id', 'store_id']);
            });

            if (Schema::hasTable('shop_user') && Schema::hasTable('shops')) {
                DB::table('shop_user')->orderBy('id')->each(function ($pivot): void {
                    $storeId = DB::table('stores')->where('id', $pivot->shop_id)->value('id');

                    if (! $storeId) {
                        return;
                    }

                    DB::table('user_store')->insert([
                        'user_id' => $pivot->user_id,
                        'store_id' => $storeId,
                        'role_in_store' => null,
                        'status' => 'active',
                        'assigned_at' => $pivot->created_at,
                        'ended_at' => null,
                        'metadata' => null,
                        'created_at' => $pivot->created_at,
                        'updated_at' => $pivot->updated_at,
                    ]);
                });
            }
        }

        if (! Schema::hasTable('permissions')) {
            Schema::create('permissions', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->string('guard_name')->default('web');
                $table->string('description')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();
                $table->unique(['name', 'guard_name']);
            });
        }

        if (Schema::hasTable('roles') && ! Schema::hasColumn('roles', 'guard_name')) {
            Schema::table('roles', function (Blueprint $table): void {
                $table->string('guard_name')->default('web')->after('name');
                $table->json('metadata')->nullable()->after('description');
            });
        }

        if (! Schema::hasTable('role_has_permissions')) {
            Schema::create('role_has_permissions', function (Blueprint $table): void {
                $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
                $table->foreignId('role_id')->constrained()->cascadeOnDelete();
                $table->primary(['permission_id', 'role_id']);
            });
        }

        if (! Schema::hasTable('model_has_roles')) {
            Schema::create('model_has_roles', function (Blueprint $table): void {
                $table->foreignId('role_id')->constrained()->cascadeOnDelete();
                $table->unsignedBigInteger('model_id');
                $table->string('model_type');
                $table->index(['model_id', 'model_type']);
            });
        }

        if (! Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('action');
                $table->morphs('auditable');
                $table->json('before')->nullable();
                $table->json('after')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('model_has_roles');
        Schema::dropIfExists('role_has_permissions');

        if (Schema::hasTable('roles') && Schema::hasColumn('roles', 'guard_name')) {
            Schema::table('roles', function (Blueprint $table): void {
                $table->dropColumn(['guard_name', 'metadata']);
            });
        }

        Schema::dropIfExists('permissions');
        Schema::dropIfExists('user_store');
        Schema::dropIfExists('stores');
    }
};
