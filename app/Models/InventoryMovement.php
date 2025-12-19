<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    use HasFactory;

    public const TYPE_IN = 'in';
    public const TYPE_OUT = 'out';
    public const TYPE_ADJUST = 'adjust';
    public const TYPE_RESERVE = 'reserve';
    public const TYPE_RELEASE = 'release';

    protected $fillable = [
        'shop_id',
        'product_id',
        'batch_id',
        'type',
        'qty',
        'reason',
        'order_id',
        'user_id',
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Product>
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<ProductBatch>
     */
    public function batch()
    {
        return $this->belongsTo(ProductBatch::class, 'batch_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Order>
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Store>
     */
    public function shop()
    {
        return $this->belongsTo(Store::class, 'shop_id');
    }
}
