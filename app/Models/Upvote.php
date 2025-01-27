<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Upvote extends Model
{
    // Define a one-to-one relationship with the Feature model
    public function feature(): BelongsTo
    {
        // An upvote belongs to one feature
        return $this->belongsTo(Feature::class);
    }
}
