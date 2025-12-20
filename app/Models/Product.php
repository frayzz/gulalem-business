<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;

    public const TYPE_FLOWER = 'flower';
    public const TYPE_MATERIAL = 'material';
    public const TYPE_BOUQUET = 'bouquet';

    protected $fillable = [
        'shop_id',
        'type',
        'name',
        'unit',
        'sku',
        'active',
        'default_price',
    ];

    protected static function booted(): void
    {
        static::creating(function (Product $product) {
            if (empty($product->sku)) {
                $product->sku = self::generateSku();
            }
        });
    }

    public static function generateSku(): string
    {
        do {
            $sku = Str::upper(Str::random(10));
        } while (self::where('sku', $sku)->exists());

        return $sku;
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<ProductBatch>
     */
    public function batches()
    {
        return $this->hasMany(ProductBatch::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasOne<BouquetRecipe>
     */
    public function bouquetRecipe()
    {
        return $this->hasOne(BouquetRecipe::class, 'bouquet_product_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Store, Product>
     */
    public function store()
    {
        return $this->belongsTo(Store::class, 'shop_id');
    }
}
