<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration creates a new table named 'bodega_denominaciones' with the following columns:
     * - id: Auto-incrementing primary key (not used in this composite key setup).
     * - bodega_id: An unsigned big integer representing the foreign key to the 'bodegas' table.
     * - denominacion_id: An unsigned big integer representing the foreign key to the 'denominaciones' table.
     * - created_at: A timestamp indicating when the record was created.
     * - updated_at: A timestamp indicating when the record was last updated.
     *
     * The table uses a composite primary key consisting of 'bodega_id' and 'denominacion_id'.
     */
    public function up(): void
    {
        Schema::create('bodega_denominaciones', function (Blueprint $table) {
            $table->unsignedBigInteger('bodega_id')->comment('Foreign key to the bodegas table');
            $table->unsignedBigInteger('denominacion_id')->comment('Foreign key to the denominaciones table');
            $table->primary(['bodega_id', 'denominacion_id']); // Composite primary key

            // Definición de las claves foráneas
            $table->foreign('bodega_id')->references('id')->on('bodegas')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('denominacion_id')->references('id')->on('denominaciones')->onDelete('cascade')->onUpdate('cascade');
            $table->timestamps(); // Campos de created_at y updated_at
        });
    }

    /**
     * Reverse the migrations.
     *
     * This method drops the 'bodega_denominaciones' table if it exists.
     */
    public function down(): void
    {
        Schema::dropIfExists('bodega_denominaciones');
    }
};
