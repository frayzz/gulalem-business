<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Services\PhoneNormalizer;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'name',
        'phone',
        'phone_e164',
        'email',
        'birthday',
        'notes',
    ];

    public function getPhoneAttribute($value): ?string
    {
        return $this->attributes['phone'] ?? $value;
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Store>
     */
    public function shop()
    {
        return $this->belongsTo(Store::class, 'shop_id');
    }

    public static function normalizePhone(?string $phone): ?string
    {
        return app(PhoneNormalizer::class)->normalize($phone);
    }

    public function setPhoneAttribute(?string $phone): void
    {
        $this->attributes['phone'] = self::normalizePhone($phone);
        $this->attributes['phone_e164'] = self::normalizePhone($phone);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<Order>
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
