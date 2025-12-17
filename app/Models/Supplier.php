<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'contact',
        'phone',
        'notes',
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<ProductBatch>
     */
    public function productBatches()
    {
        return $this->hasMany(ProductBatch::class);
    }
}
