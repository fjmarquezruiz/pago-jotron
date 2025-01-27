<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration creates a new table named 'denominaciones' with the following columns:
     * - id: Auto-incrementing primary key.
     * - name: A unique and non-nullable string representing the name of the denomination, with a maximum length of 100 characters.
     * - blocked: A boolean indicating whether the denomination is blocked, with a default value of false.
     * - created_at: A timestamp indicating when the record was created.
     * - updated_at: A timestamp indicating when the record was last updated.
     */
    public function up(): void
    {
        Schema::create('denominaciones', function (Blueprint $table) {
            $table->id(); // Using the default 'id' column for primary key
            $table->string('name', 100)->unique()->comment('Unique name of the denomination');
            $table->boolean('blocked')->default(false)->comment('Indicates if the denomination is blocked');
            $table->timestamps(); // Campos de created_at y updated_at
        });
    }

    /**
     * Reverse the migrations.
     *
     * This method drops the 'denominaciones' table if it exists.
     */
    public function down(): void
    {
        Schema::dropIfExists('denominaciones');
    }
};
