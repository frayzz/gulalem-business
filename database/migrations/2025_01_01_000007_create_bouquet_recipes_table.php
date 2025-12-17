<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('bouquet_recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bouquet_product_id')->constrained('products')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('bouquet_recipe_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained('bouquet_recipes')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('qty', 12, 3);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bouquet_recipe_items');
        Schema::dropIfExists('bouquet_recipes');
    }
};
