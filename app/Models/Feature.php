<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Feature extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'user_id'];

    // Define a one-to-many relationship with the Upvote model
    public function upvotes(): HasMany
    {
        // A feature can have many upvotes
        return $this->hasMany(Upvote::class);
    }

    // Define a one-to-many relationship with the Comment model
    public function comments(): HasMany
    {
        // A feature can have many comments
        return $this->hasMany(Comment::class);
    }

    // Define a one-to-one relationship with the User model
    public function user(): BelongsTo
    {
        // A feature belongs to one user
        return $this->belongsTo(User::class);
    }
}
