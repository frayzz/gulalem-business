<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BouquetRecipeItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'recipe_id',
        'product_id',
        'qty',
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<BouquetRecipe>
     */
    public function recipe()
    {
        return $this->belongsTo(BouquetRecipe::class, 'recipe_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Product>
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
