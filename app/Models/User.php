<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
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
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Role>
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class)->withTimestamps();
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Store>
     */
    public function stores()
    {
        return $this->belongsToMany(Store::class, 'shop_user', 'user_id', 'shop_id')->withTimestamps();
    }

    /**
     * @return \Illuminate\Support\Collection<int, Store>
     */
    public function accessibleStores()
    {
        if ($this->hasRole(['owner'])) {
            return Store::query()->orderBy('name')->get();
        }

        return $this->stores()->orderBy('name')->get();
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
