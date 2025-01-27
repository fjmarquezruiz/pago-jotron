<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This method creates the 'vino_uvas' table with the following structure:
     * - vino_id: Unsigned big integer, foreign key referencing 'id' in the 'vinos' table.
     * - uva_id: Unsigned big integer, foreign key referencing 'id' in the 'uvas' table.
     * - percent: Decimal with precision 5 and scale 2, representing the percentage.
     *
     * The table uses a composite primary key consisting of 'vino_id' and 'uva_id'.
     * Foreign key constraints are set with cascading delete and update actions.
     */
    public function up(): void
    {
        Schema::create('vino_uvas', function (Blueprint $table) {

            // Define the columns
            $table->unsignedBigInteger('vino_id')->comment('Foreign key to the vinos table');
            $table->unsignedBigInteger('uva_id')->comment('Foreign key to the uvas table');
            $table->decimal('percent', 5, 2);

            // Set the primary key
            $table->primary(['vino_id', 'uva_id']);

            // Define foreign keys with cascading actions
            $table->foreign('vino_id')->references('id')->on('vinos')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('uva_id')->references('id')->on('uvas')->onDelete('cascade')->onUpdate('cascade');

            $table->timestamps(); // Automatically adds 'created_at' and 'updated_at' columns
        });
    }

    /**
     * Reverse the migrations.
     *
     * This method drops the 'vino_uvas' table if it exists.
     */
    public function down(): void
    {
        Schema::dropIfExists('vino_uvas');
    }
};
