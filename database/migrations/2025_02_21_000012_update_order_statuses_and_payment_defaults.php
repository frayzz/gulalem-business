<?php

use App\Models\Order;
use App\Services\PaymentService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status')->default(Order::STATUS_DRAFT)->change();
            $table->string('payment_status')->default(PaymentService::STATUS_UNPAID)->change();
        });

        DB::transaction(function () {
            DB::table('orders')->where('status', 'new')->update(['status' => Order::STATUS_DRAFT]);
            DB::table('orders')->where('status', 'in_progress')->update(['status' => Order::STATUS_CONFIRMED]);
            DB::table('orders')->where('status', 'ready')->update(['status' => Order::STATUS_IN_ASSEMBLY]);
            DB::table('orders')->where('status', 'delivered')->orWhere('status', 'completed')->update(['status' => Order::STATUS_DELIVERED]);
            DB::table('orders')->where('status', 'cancelled')->update(['status' => Order::STATUS_CANCELED]);

            DB::table('orders')->where('payment_status', 'pending')->update(['payment_status' => PaymentService::STATUS_UNPAID]);
            DB::table('orders')->where('payment_status', 'partial')->update(['payment_status' => PaymentService::STATUS_PARTIALLY_PAID]);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status')->default('new')->change();
            $table->string('payment_status')->default('pending')->change();
        });
    }
};
