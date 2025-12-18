<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
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

    public static function normalizePhone(?string $phone): ?string
    {
        if (!$phone) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone);

        if (!$digits) {
            return null;
        }

        if (strlen($digits) === 11 && str_starts_with($digits, '8')) {
            $digits = '7'.substr($digits, 1);
        }

        if (strlen($digits) === 10) {
            $digits = '7'.$digits;
        }

        return '+'.$digits;
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
