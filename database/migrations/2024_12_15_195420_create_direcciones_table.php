<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration creates a new table named 'direcciones' with the following columns:
     * - id: Auto-incrementing primary key.
     * - phone: A string representing the phone number, with a maximum length of 20 characters.
     * - street_type: An enum representing the type of street, with possible values 'Street', 'Avenue', 'Boulevard', 'Square', 'Path', 'Promenade', 'StreetCar', 'Route', and a default value of 'Street'.
     * - street_name: A string representing the name of the street, with a maximum length of 100 characters.
     * - street_number: A string representing the street number, with a maximum length of 10 characters.
     * - postal_code: A string representing the postal code, with a maximum length of 10 characters.
     * - locality: A string representing the locality, with a maximum length of 100 characters.
     * - province: A string representing the province, with a maximum length of 100 characters.
     * - country: A string representing the country, with a maximum length of 100 characters.
     * - address_type: An enum representing the type of address, with possible values 'Shipping', 'Billing', and a default value of 'Shipping'.
     * - created_at: A timestamp indicating when the record was created.
     * - updated_at: A timestamp indicating when the record was last updated.
     */
    public function up(): void
    {
        Schema::create('direcciones', function (Blueprint $table) {
            $table->id();
            $table->string('phone', 20)->comment('Phone number');
            $table->enum('street_type', ['Street', 'Avenue', 'Boulevard', 'Square', 'Path', 'Promenade', 'StreetCar', 'Route'])->default('Street')->comment('Type of street');
            $table->string('street_name', 100)->comment('Name of the street');
            $table->string('street_number', 10)->comment('Street number');
            $table->string('postal_code', 10)->comment('Postal code');
            $table->string('locality', 100)->comment('Locality');
            $table->string('province', 100)->comment('Province');
            $table->string('country', 100)->comment('Country');
            $table->enum('address_type', ['Shipping', 'Billing'])->default('Shipping')->comment('Type of address');
            // Add a new boolean column 'is_billing' with a default value of TRUE
            $table->boolean('is_billing')->default(true);
            $table->unsignedBigInteger('user_id')->comment('Foreign key to the users table');
            $table->timestamps();

            // Definición de la clave foránea
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade')->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * This method drops the 'direcciones' table if it exists.
     */
    public function down(): void
    {
        Schema::dropIfExists('direcciones');
    }
};
