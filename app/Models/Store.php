<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class Store extends Model
{
    use HasFactory;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_ARCHIVED = 'archived';

    protected $table = 'stores';

    protected $fillable = [
        'name',
        'city',
        'status',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::saved(function (Store $store): void {
            if (! Schema::hasTable('shops')) {
                return;
            }

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
        });
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<User>
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'user_store', 'store_id', 'user_id')
            ->using(UserStore::class)
            ->withPivot(['role_in_store', 'status', 'assigned_at', 'ended_at', 'metadata'])
            ->withTimestamps();
    }
}
