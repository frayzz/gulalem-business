<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'owner', 'description' => 'Владелец: полный доступ'],
            ['name' => 'admin', 'description' => 'Администратор/управляющий'],
            ['name' => 'seller', 'description' => 'Продавец: заказы и касса'],
            ['name' => 'florist', 'description' => 'Флорист: сборка и статусы'],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role['name']], $role);
        }
    }
}
