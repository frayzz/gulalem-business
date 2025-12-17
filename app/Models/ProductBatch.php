<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'supplier_id',
        'buy_price',
        'qty_in',
        'qty_left',
        'arrived_at',
        'expires_at',
    ];

    protected $casts = [
        'arrived_at' => 'date',
        'expires_at' => 'date',
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Product>
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Supplier>
     */
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
