<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration creates a new table named 'vinos' with the following columns:
     * - id: Auto-incrementing primary key.
     * - name: A non-nullable string representing the name of the wine, with a maximum length of 100 characters.
     * - price: A non-nullable decimal representing the price of the wine, with precision 10 and scale 2.
     * - stock: A non-nullable integer representing the stock quantity of the wine, with a default value of 0.
     * - vintage_year: An optional integer representing the vintage year of the wine.
     * - image_url: An optional string representing the image URL of the wine, with a maximum length of 255 characters.
     * - description: An optional text field providing a description of the wine.
     * - visual: An optional text field describing the visual characteristics of the wine.
     * - aromas: An optional text field describing the aromas of the wine.
     * - taste: An optional text field describing the taste and finish of the wine.
     * - capacity: An optional integer representing the bottle capacity in milliliters.
     * - minimum_temperature: An optional decimal representing the minimum serving temperature of the wine, with precision 5 and scale 2.
     * - maximum_temperature: An optional decimal representing the maximum serving temperature of the wine, with precision 5 and scale 2.
     * - alcohol: An optional decimal representing the alcohol content of the wine, with precision 5 and scale 2.
     * - food_pairing: An optional text field suggesting food pairings for the wine.
     * - blocked: A boolean indicating whether the wine is blocked, with a default value of false.
     * - bodega_id: An unsigned big integer representing the foreign key to the 'bodegas' table.
     * - denominacion_id: An unsigned big integer representing the foreign key to the 'denominaciones' table.
     * - created_at: A timestamp indicating when the record was created.
     * - updated_at: A timestamp indicating when the record was last updated.
     */
    public function up(): void
    {
        Schema::create('vinos', function (Blueprint $table) {
            $table->id(); // Using the default 'id' column for primary key
            $table->string('name', 100)->comment('Name of the wine');
            $table->decimal('price', 10, 2)->comment('Price of the wine');
            $table->integer('stock')->default(0)->comment('Stock quantity of the wine');
            $table->integer('vintage_year')->nullable()->comment('Vintage year of the wine');
            $table->string('image_url', 255)->nullable()->comment('Image URL of the wine');
            $table->text('description')->nullable()->comment('Description of the wine');
            $table->text('visual')->nullable()->comment('Visual characteristics of the wine');
            $table->text('aromas')->nullable()->comment('Aromas of the wine');
            $table->text('taste')->nullable()->comment('Taste and finish of the wine');
            $table->integer('capacity')->nullable()->comment('Bottle capacity in milliliters');
            $table->decimal('minimum_temperature', 5, 2)->nullable()->comment('Minimum serving temperature of the wine');
            $table->decimal('maximum_temperature', 5, 2)->nullable()->comment('Maximum serving temperature of the wine');
            $table->decimal('alcohol', 5, 2)->nullable()->comment('Alcohol content of the wine');
            $table->text('food_pairing')->nullable()->comment('Food pairings for the wine');
            $table->boolean('blocked')->default(false)->comment('Indicates if the wine is blocked');
            $table->unsignedBigInteger('bodega_id')->comment('Foreign key to the bodegas table');
            $table->unsignedBigInteger('denominacion_id')->comment('Foreign key to the denominaciones table');
            $table->unsignedBigInteger('categoria_id')->comment('Foreign key to the categorias table');

            // Define foreign keys with cascading actions
            $table->foreign('bodega_id')->references('id')->on('bodegas')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('denominacion_id')->references('id')->on('denominaciones')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('categoria_id')->references('id')->on('categorias')->onDelete('cascade')->onUpdate('cascade');

            $table->timestamps(); // Fields de created_at y updated_at
        });
    }

    /**
     * Reverse the migrations.
     *
     * This method drops the 'vinos' table if it exists.
     */
    public function down(): void
    {
        Schema::dropIfExists('vinos');
    }
};
