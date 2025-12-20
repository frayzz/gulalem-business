<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class AccessSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'manage_stores', 'description' => 'Manage store records and settings'],
            ['name' => 'assign_users', 'description' => 'Assign users to stores'],
            ['name' => 'manage_inventory', 'description' => 'Create and update inventory items'],
            ['name' => 'manage_orders', 'description' => 'Handle customer orders and payments'],
            ['name' => 'view_reports', 'description' => 'Access operational reports'],
        ];

        $permissionIds = collect($permissions)
            ->map(function (array $data) {
                $permission = Permission::firstOrCreate(
                    ['name' => $data['name'], 'guard_name' => 'web'],
                    $data,
                );

                return $permission->id;
            })
            ->all();

        $roles = [
            'super_admin' => ['description' => 'Полный доступ ко всем функциям', 'permissions' => 'all'],
            'owner' => ['description' => 'Управление магазинами и пользователями', 'permissions' => ['manage_stores', 'assign_users', 'view_reports']],
            'admin' => ['description' => 'Администрирование магазинов и заказов', 'permissions' => ['manage_inventory', 'manage_orders', 'view_reports']],
            'staff' => ['description' => 'Работа с заказами и складом', 'permissions' => ['manage_inventory', 'manage_orders']],
        ];

        foreach ($roles as $name => $config) {
            $role = Role::firstOrCreate(
                ['name' => $name, 'guard_name' => 'web'],
                ['description' => $config['description'], 'metadata' => ['seeded' => true]],
            );

            $permissionsToSync = $config['permissions'] === 'all'
                ? $permissionIds
                : Permission::whereIn('name', $config['permissions'])->pluck('id')->all();

            $role->permissions()->sync($permissionsToSync);
        }

        $superAdmin = User::firstOrCreate(
            ['email' => 'super.admin@example.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $superAdminRoleId = Role::where('name', 'super_admin')->value('id');

        if ($superAdminRoleId) {
            $superAdmin->roles()->syncWithoutDetaching([$superAdminRoleId]);
        }

        if (Store::count() === 0) {
            $store = Store::create([
                'name' => 'Главный магазин',
                'city' => 'Санкт-Петербург',
                'status' => Store::STATUS_ACTIVE,
            ]);

            if (Schema::hasTable('shops')) {
                DB::table('shops')->updateOrInsert(
                    ['id' => $store->id],
                    [
                        'name' => $store->name,
                        'city' => $store->city,
                        'status' => $store->status,
                        'created_at' => $store->created_at,
                        'updated_at' => $store->updated_at,
                    ],
                );
            }
        }
    }
}
