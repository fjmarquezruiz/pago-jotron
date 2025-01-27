<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VinoUva extends Model
{
    use HasFactory;

    // Specify the table name if it's different from the default
    protected $table = 'vino_uvas';

    // Specify the composite primary key
    // protected $primaryKey = ['vino_id', 'uva_id'];

    // Indicate that the primary key is not auto-incrementing
    // public $incrementing = false;

    // Specify the fillable fields
    protected $fillable = ['vino_id', 'uva_id', 'percent'];

    public function vino()
    {
        return $this->belongsTo(Vino::class);
    }

    public function uva()
    {
        return $this->belongsTo(Uva::class);
    }
}
