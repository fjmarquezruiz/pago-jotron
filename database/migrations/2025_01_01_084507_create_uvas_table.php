<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This method creates the 'uvas' table with the following structure:
     * - id: Auto-incrementing unsigned big integer, primary key.
     * - name: String with a maximum length of 100 characters, representing the name of the grape variety.
     * - created_at: Timestamp indicating when the record was created.
     * - updated_at: Timestamp indicating when the record was last updated.
     */
    public function up(): void
    {
        Schema::create('uvas', function (Blueprint $table) {
            $table->id()->comment('Auto-incrementing primary key');
            $table->string('name', 100)->comment('Name of the grape variety');
            $table->timestamps(); // Automatically adds 'created_at' and 'updated_at' columns
        });
    }

    /**
     * Reverse the migrations.
     *
     * This method drops the 'uvas' table if it exists.
     */
    public function down(): void
    {
        Schema::dropIfExists('uvas');
    }
};
