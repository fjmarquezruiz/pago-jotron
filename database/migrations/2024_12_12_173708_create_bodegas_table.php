<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration creates a new table named 'bodegas' with the following columns:
     * - id: Auto-incrementing primary key.
     * - name: A unique string representing the name of the warehouse, with a maximum length of 100 characters.
     * - city: A nullable string representing the locality of the warehouse, with a maximum length of 100 characters.
     * - province: A nullable string representing the province of the warehouse, with a maximum length of 100 characters.
     * - blocked: A boolean indicating whether the warehouse is blocked, with a default value of false.
     * - created_at: A timestamp indicating when the record was created.
     * - updated_at: A timestamp indicating when the record was last updated.
     */
    public function up(): void
    {
        Schema::create('bodegas', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique()->comment('Unique name of the warehouse');
            $table->string('city', 100)->nullable()->comment('Locality of the warehouse');
            $table->string('province', 100)->nullable()->comment('Province of the warehouse');
            $table->boolean('blocked')->default(false)->comment('Indicates if the warehouse is blocked');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * This method drops the 'bodegas' table if it exists.
     */
    public function down(): void
    {
        Schema::dropIfExists('bodegas');
    }
};
