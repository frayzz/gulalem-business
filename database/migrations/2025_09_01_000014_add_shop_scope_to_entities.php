<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table): void {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained('shops')->nullOnDelete();
            $table->index('shop_id');
        });

        Schema::table('orders', function (Blueprint $table): void {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained('shops')->nullOnDelete();
            $table->index('shop_id');
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained('shops')->nullOnDelete();
            $table->index('shop_id');
        });

        Schema::table('product_batches', function (Blueprint $table): void {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained('shops')->nullOnDelete();
            $table->index('shop_id');
        });

        Schema::table('inventory_movements', function (Blueprint $table): void {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained('shops')->nullOnDelete();
            $table->index('shop_id');
        });

        Schema::table('inventory_reservations', function (Blueprint $table): void {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained('shops')->nullOnDelete();
            $table->index('shop_id');
        });

        Schema::table('cash_shifts', function (Blueprint $table): void {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained('shops')->nullOnDelete();
            $table->index('shop_id');
        });
    }

    public function down(): void
    {
        Schema::table('cash_shifts', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('shop_id');
        });

        Schema::table('inventory_reservations', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('shop_id');
        });

        Schema::table('inventory_movements', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('shop_id');
        });

        Schema::table('product_batches', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('shop_id');
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('shop_id');
        });

        Schema::table('orders', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('shop_id');
        });

        Schema::table('customers', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('shop_id');
        });
    }
};
