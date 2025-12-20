<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsToMany<Role>
     */
    public function roles()
    {
        return $this->morphToMany(Role::class, 'model', 'model_has_roles', 'model_id', 'role_id')
            ->withTimestamps();
    }

    /**
     * @return BelongsToMany<Store>
     */
    public function stores()
    {
        return $this->belongsToMany(Store::class, 'user_store', 'user_id', 'store_id')
            ->using(UserStore::class)
            ->withPivot(['role_in_store', 'status', 'assigned_at', 'ended_at', 'metadata'])
            ->withTimestamps();
    }

    /**
     * @return \Illuminate\Support\Collection<int, Store>
     */
    public function accessibleStores()
    {
        $storesQuery = $this->stores()
            ->wherePivot('status', UserStore::STATUS_ACTIVE)
            ->where('status', Store::STATUS_ACTIVE)
            ->orderBy('name');

        if ($this->hasRole(['owner', 'super_admin'])) {
            return Store::query()
                ->where('status', Store::STATUS_ACTIVE)
                ->orderBy('name')
                ->get();
        }

        return $storesQuery->get();
    }

    /**
     * Проверяет наличие хотя бы одной из запрошенных ролей.
     *
     * @param  string[]  $roles
     */
    public function hasRole(array $roles): bool
    {
        return $this->roles()->whereIn('name', $roles)->exists();
    }
}
