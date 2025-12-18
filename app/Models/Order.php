<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_IN_ASSEMBLY = 'in_assembly';
    public const STATUS_READY = 'ready';
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_CANCELED = 'canceled';

    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_CONFIRMED,
        self::STATUS_IN_ASSEMBLY,
        self::STATUS_READY,
        self::STATUS_DELIVERED,
        self::STATUS_CANCELED,
    ];

    protected $fillable = [
        'customer_id',
        'status',
        'delivery_type',
        'delivery_address',
        'delivery_time',
        'total',
        'discount',
        'paid_total',
        'payment_status',
        'notes',
    ];

    protected $casts = [
        'delivery_time' => 'datetime',
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Customer>
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<OrderItem>
     */
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<Payment>
     */
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<PaymentStatusHistory>
     */
    public function paymentStatusHistory()
    {
        return $this->hasMany(PaymentStatusHistory::class);
    }
}
