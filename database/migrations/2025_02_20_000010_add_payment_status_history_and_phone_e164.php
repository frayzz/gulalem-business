<?php

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('phone_e164')->nullable()->after('phone');
        });

        Schema::create('payment_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('old_status')->nullable();
            $table->string('new_status');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        DB::transaction(function () {
            $customers = Customer::query()->get();
            $duplicates = [];

            foreach ($customers as $customer) {
                $normalized = Customer::normalizePhone($customer->phone ?? $customer->getAttribute('phone'));
                $customer->phone_e164 = $normalized;
                $customer->save();

                if ($normalized) {
                    $duplicates[$normalized][] = $customer->id;
                }
            }

            foreach ($duplicates as $normalized => $ids) {
                if (count($ids) <= 1) {
                    continue;
                }

                $primaryId = array_shift($ids);
                Order::whereIn('customer_id', $ids)->update(['customer_id' => $primaryId]);
                Customer::whereIn('id', $ids)->delete();
            }

            DB::table('orders')->whereNull('payment_status')->update(['payment_status' => 'unpaid']);
            DB::table('orders')->whereNull('status')->update(['status' => 'draft']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->unique('phone_e164');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropUnique(['phone_e164']);
            $table->dropColumn('phone_e164');
        });

        Schema::dropIfExists('payment_status_histories');

        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_status')->default('pending')->change();
            $table->string('status')->default('new')->change();
        });
    }
};
