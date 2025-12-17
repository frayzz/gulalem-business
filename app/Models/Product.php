<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    public const TYPE_FLOWER = 'flower';
    public const TYPE_MATERIAL = 'material';
    public const TYPE_BOUQUET = 'bouquet';

    protected $fillable = [
        'type',
        'name',
        'unit',
        'sku',
        'active',
        'default_price',
    ];

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
}
