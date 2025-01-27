<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    // Define a one-to-one relationship with the User model
    public function user(): BelongsTo
    {
        // A comment belongs to one user
        return $this->belongsTo(User::class);
    }

    // Define a one-to-one relationship with the Feature model
    public function feature(): BelongsTo
    {
        // A comment belongs to one feature
        return $this->belongsTo(Feature::class);
    }
}
