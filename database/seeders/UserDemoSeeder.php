<?php

namespace Database\Seeders;

use App\Models\BouquetRecipe;
use App\Models\CashShift;
use App\Models\Customer;
use App\Models\InventoryMovement;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\Role;
use App\Models\Store;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class UserDemoSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $user = $this->seedOwner();
            $store = $this->seedStore($user);
            $suppliers = $this->seedSuppliers();
            $products = $this->seedProducts();
            $batches = $this->seedProductBatches($products, $suppliers);
            $this->seedBouquetRecipe($products);
            $customers = $this->seedCustomers();
            $orders = $this->seedOrders($customers, $products, $user);
            $this->seedInventoryReservations($orders, $products);
            $this->seedInventoryMovements($products, $batches, $user);
            $this->seedCashShift($user);
        });
    }

    private function seedOwner(): User
    {
        $user = Model::unguarded(fn () => User::updateOrCreate(
            ['id' => 1],
            [
                'name' => 'Owner User',
                'email' => 'owner@example.com',
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        ));

        $ownerRoleId = Role::where('name', 'owner')->value('id');

        if ($ownerRoleId) {
            $user->roles()->syncWithoutDetaching([$ownerRoleId]);
        }

        return $user;
    }

    private function seedStore(User $user): Store
    {
        $store = Store::updateOrCreate(
            ['name' => 'Главный магазин'],
            [
                'city' => 'Санкт-Петербург',
                'status' => 'active',
            ],
        );

        $store->users()->syncWithoutDetaching([$user->id]);

        return $store;
    }

    /**
     * @return array<string, Product>
     */
    private function seedProducts(): array
    {
        $products = [
            'roses' => [
                'type' => Product::TYPE_FLOWER,
                'name' => 'Роза Freedom 60 см',
                'unit' => 'pcs',
                'sku' => 'ROSE-FR-60',
                'default_price' => 250,
                'active' => true,
            ],
            'eustoma' => [
                'type' => Product::TYPE_FLOWER,
                'name' => 'Эустома белая',
                'unit' => 'pcs',
                'sku' => 'EUS-WH-70',
                'default_price' => 180,
                'active' => true,
            ],
            'wrapping' => [
                'type' => Product::TYPE_MATERIAL,
                'name' => 'Упаковка крафт',
                'unit' => 'sheet',
                'sku' => 'WRAP-KRAFT',
                'default_price' => 35,
                'active' => true,
            ],
            'bouquet' => [
                'type' => Product::TYPE_BOUQUET,
                'name' => 'Букет «Красная классика»',
                'unit' => 'pcs',
                'sku' => 'BQ-RED-CLASSIC',
                'default_price' => 1890,
                'active' => true,
            ],
        ];

        return collect($products)
            ->mapWithKeys(fn (array $data, string $key) => [
                $key => Product::updateOrCreate(['sku' => $data['sku']], $data),
            ])
            ->all();
    }

    /**
     * @return array<string, Supplier>
     */
    private function seedSuppliers(): array
    {
        $suppliers = [
            'flowerFarm' => [
                'name' => 'Sever Flor',
                'contact' => 'Алексей',
                'phone' => '+7 921 333-22-11',
                'notes' => 'Основной поставщик роз и эустомы.',
            ],
            'packaging' => [
                'name' => 'Упаковка+ Питер',
                'contact' => 'Марина',
                'phone' => '+7 911 555-44-33',
                'notes' => 'Крафт и ленты, быстрые поставки.',
            ],
        ];

        return collect($suppliers)
            ->mapWithKeys(fn (array $data, string $key) => [
                $key => Supplier::updateOrCreate(['name' => $data['name']], $data),
            ])
            ->all();
    }

    /**
     * @param  array<string, Product>  $products
     * @param  array<string, Supplier>  $suppliers
     * @return array<string, ProductBatch>
     */
    private function seedProductBatches(array $products, array $suppliers): array
    {
        $today = now();

        $batches = [
            'roses' => [
                'product_id' => $products['roses']->id,
                'supplier_id' => $suppliers['flowerFarm']->id ?? null,
                'buy_price' => 110,
                'qty_in' => 50,
                'qty_left' => 48,
                'arrived_at' => $today->copy()->subDays(2)->toDateString(),
                'expires_at' => $today->copy()->addDays(5)->toDateString(),
            ],
            'eustoma' => [
                'product_id' => $products['eustoma']->id,
                'supplier_id' => $suppliers['flowerFarm']->id ?? null,
                'buy_price' => 80,
                'qty_in' => 30,
                'qty_left' => 28,
                'arrived_at' => $today->copy()->subDay()->toDateString(),
                'expires_at' => $today->copy()->addDays(6)->toDateString(),
            ],
            'wrapping' => [
                'product_id' => $products['wrapping']->id,
                'supplier_id' => $suppliers['packaging']->id ?? null,
                'buy_price' => 10,
                'qty_in' => 100,
                'qty_left' => 95,
                'arrived_at' => $today->copy()->subDays(3)->toDateString(),
                'expires_at' => null,
            ],
        ];

        return collect($batches)
            ->mapWithKeys(fn (array $data, string $key) => [
                $key => ProductBatch::updateOrCreate(
                    Arr::only($data, ['product_id', 'arrived_at']),
                    $data,
                ),
            ])
            ->all();
    }

    /**
     * @param  array<string, Product>  $products
     */
    private function seedBouquetRecipe(array $products): void
    {
        $recipe = BouquetRecipe::updateOrCreate(
            ['bouquet_product_id' => $products['bouquet']->id],
            [],
        );

        $recipe->items()->delete();

        $recipe->items()->createMany([
            [
                'product_id' => $products['roses']->id,
                'qty' => 11,
            ],
            [
                'product_id' => $products['wrapping']->id,
                'qty' => 1,
            ],
        ]);
    }

    /**
     * @return array<string, Customer>
     */
    private function seedCustomers(): array
    {
        $customers = [
            'anna' => [
                'name' => 'Анна Смирнова',
                'phone' => '+7 (921) 000-11-22',
                'email' => 'anna@example.com',
                'birthday' => '1992-03-14',
                'notes' => 'Предпочитает красные букеты.',
            ],
            'ivan' => [
                'name' => 'Иван Петров',
                'phone' => '+7 999 444-55-66',
                'email' => 'ivan@example.com',
                'birthday' => '1988-10-01',
                'notes' => 'Любит эустомы, доставка утром.',
            ],
        ];

        return collect($customers)
            ->mapWithKeys(fn (array $data, string $key) => [
                $key => Customer::updateOrCreate(['email' => $data['email']], $data),
            ])
            ->all();
    }

    /**
     * @param  array<string, Customer>  $customers
     * @param  array<string, Product>  $products
     * @return array<string, Order>
     */
    private function seedOrders(array $customers, array $products, User $user): array
    {
        $firstOrder = Order::updateOrCreate(
            ['id' => 1],
            [
                'customer_id' => $customers['anna']->id,
                'status' => Order::STATUS_DELIVERED,
                'delivery_type' => 'delivery',
                'delivery_address' => 'Невский пр., 12',
                'delivery_time' => now()->addHours(2),
                'total' => 2250,
                'discount' => 100,
                'paid_total' => 2150,
                'payment_status' => 'paid',
                'notes' => 'Доставить до 12:00, добавить открытку.',
            ],
        );

        $firstOrder->items()->delete();
        $firstOrder->items()->createMany([
            [
                'product_id' => $products['bouquet']->id,
                'qty' => 1,
                'price' => 1890,
                'discount' => 0,
            ],
            [
                'product_id' => $products['roses']->id,
                'qty' => 3,
                'price' => 250,
                'discount' => 100,
            ],
        ]);

        $firstOrder->payments()->delete();
        $firstOrder->payments()->createMany([
            [
                'method' => 'card',
                'amount' => 1500,
            ],
            [
                'method' => 'cash',
                'amount' => 650,
            ],
        ]);

        $firstOrder->paymentStatusHistory()->delete();
        $firstOrder->paymentStatusHistory()->createMany([
            [
                'old_status' => 'pending',
                'new_status' => 'paid',
                'user_id' => $user->id,
            ],
        ]);

        $secondOrder = Order::updateOrCreate(
            ['id' => 2],
            [
                'customer_id' => $customers['ivan']->id,
                'status' => Order::STATUS_CONFIRMED,
                'delivery_type' => 'pickup',
                'delivery_address' => null,
                'delivery_time' => now()->addDay()->setHour(18),
                'total' => 720,
                'discount' => 0,
                'paid_total' => 0,
                'payment_status' => 'pending',
                'notes' => 'Самовывоз после 18:00.',
            ],
        );

        $secondOrder->items()->delete();
        $secondOrder->items()->create([
            'product_id' => $products['eustoma']->id,
            'qty' => 4,
            'price' => 180,
            'discount' => 0,
        ]);

        $secondOrder->payments()->delete();
        $secondOrder->paymentStatusHistory()->delete();

        return [
            'first' => $firstOrder,
            'second' => $secondOrder,
        ];
    }

    /**
     * @param  array<string, Order>  $orders
     * @param  array<string, Product>  $products
     */
    private function seedInventoryReservations(array $orders, array $products): void
    {
        $reservations = [
            [
                'order_id' => $orders['first']->id,
                'product_id' => $products['roses']->id,
                'qty' => 3,
            ],
            [
                'order_id' => $orders['second']->id,
                'product_id' => $products['eustoma']->id,
                'qty' => 4,
            ],
        ];

        foreach ($reservations as $reservation) {
            InventoryReservation::updateOrCreate(
                Arr::only($reservation, ['order_id', 'product_id']),
                $reservation,
            );
        }
    }

    /**
     * @param  array<string, Product>  $products
     * @param  array<string, ProductBatch>  $batches
     */
    private function seedInventoryMovements(array $products, array $batches, User $user): void
    {
        $movements = [
            [
                'product_id' => $products['roses']->id,
                'batch_id' => $batches['roses']->id,
                'type' => InventoryMovement::TYPE_IN,
                'qty' => 50,
                'reason' => 'Приход от поставщика',
                'user_id' => $user->id,
            ],
            [
                'product_id' => $products['eustoma']->id,
                'batch_id' => $batches['eustoma']->id,
                'type' => InventoryMovement::TYPE_IN,
                'qty' => 30,
                'reason' => 'Приход от поставщика',
                'user_id' => $user->id,
            ],
            [
                'product_id' => $products['wrapping']->id,
                'batch_id' => $batches['wrapping']->id,
                'type' => InventoryMovement::TYPE_IN,
                'qty' => 100,
                'reason' => 'Приход упаковки',
                'user_id' => $user->id,
            ],
            [
                'product_id' => $products['roses']->id,
                'batch_id' => $batches['roses']->id,
                'type' => InventoryMovement::TYPE_OUT,
                'qty' => 2,
                'reason' => 'Списание на букет',
                'order_id' => 1,
                'user_id' => $user->id,
            ],
        ];

        foreach ($movements as $movement) {
            InventoryMovement::updateOrCreate(
                Arr::only($movement, ['product_id', 'type', 'reason']),
                $movement,
            );
        }
    }

    private function seedCashShift(User $user): void
    {
        $openedAt = Carbon::now()->subDay()->setTime(10, 0);

        CashShift::updateOrCreate(
            ['user_id' => $user->id, 'opened_at' => $openedAt],
            [
                'closed_at' => $openedAt->copy()->addHours(10),
                'cash_start' => 5000,
                'cash_end' => 7650,
            ],
        );
    }
}
