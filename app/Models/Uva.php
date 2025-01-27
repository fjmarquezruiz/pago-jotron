<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Uva extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * This specifies the name of the database table that this model corresponds to.
     *
     * @var string
     */
    protected $table = 'uvas';

    /**
     * The attributes that are mass assignable.
     *
     * These are the fields that can be filled when creating or updating a Uva instance.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
    ];

    /**
     * Define the many-to-many relationship between Uva and Vino.
     *
     * This method specifies that a Uva can belong to many Vinos through the 'vino_uvas' pivot table.
     * It includes the 'percent' attribute from the pivot table and timestamps.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    // public function vinos()
    // {
    //     // return $this->belongsToMany(Vino::class, 'vino_uvas')
    //     //     ->withPivot('percent')
    //     //     ->withTimestamps();
    //     return $this->belongsToMany(Vino::class, 'vino_uvas', 'uva_id', 'vino_id')->withPivot('percent');
    // }

    public function vinos()
    {
        return $this->belongsToMany(Vino::class, 'vino_uvas')->withPivot('percent')->withTimestamps();
    }
}
