<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // User's first name
            $table->string('last_name'); // User's last name
            $table->date('date_of_birth'); // User's date of birth
            $table->string('email')->unique(); // User's email address
            $table->timestamp('email_verified_at')->nullable(); // Timestamp of when the email was verified
            $table->string('password'); // User's hashed password
            $table->string('id_card', 20)->unique()->nullable(); // User's ID card number
            $table->string('phone_number', 20)->nullable(); // User's phone number
            $table->boolean('account_status')->default(true); // User's account status (active/inactive)
            $table->boolean('age_verified')->default(false); // Whether the user's age has been verified
            $table->rememberToken(); // Remember token for "Remember Me" functionality
            $table->timestamps(); // created_at and updated_at timestamps
            $table->index('email'); // Index for faster lookup of emails
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary(); // Email associated with the password reset token
            $table->string('token'); // Password reset token
            $table->timestamp('created_at')->nullable(); // Timestamp of when the token was created
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary(); // Session ID
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade'); // Foreign key to users table
            $table->string('ip_address', 45)->nullable(); // IP address of the user
            $table->text('user_agent')->nullable(); // User agent string
            $table->longText('payload'); // Serialized session data
            $table->integer('last_activity')->index(); // Timestamp of the last activity
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
