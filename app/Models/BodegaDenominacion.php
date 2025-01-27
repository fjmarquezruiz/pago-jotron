<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * BodegaDenominacion Model
 *
 * Represents the bodega_denominaciones table in the database.
 * This table serves as a pivot table for the many-to-many relationship between bodegas and denominaciones.
 *
 * @property int $bodega_id
 * @property int $denominacion_id
 * @property-read \App\Models\Bodega $bodega
 * @property-read \App\Models\Denominacion $denominacion
 * @method static \Database\Factories\BodegaDenominacionFactory factory(...$parameters)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\BodegaDenominacion newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\BodegaDenominacion newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\BodegaDenominacion query()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\BodegaDenominacion whereBodegaId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\BodegaDenominacion whereDenominacionId($value)
 * @mixin \Eloquent
 */
class BodegaDenominacion extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * This specifies the name of the database table that this model corresponds to.
     *
     * @var string
     */
    protected $table = 'bodega_denominaciones';

    /**
     * The attributes that are mass assignable.
     *
     * These are the fields that can be filled when creating or updating a BodegaDenominacion instance.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'bodega_id',
        'denominacion_id',
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * Since this is a pivot table, we typically do not need timestamps.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get the bodega associated with the bodega_denominacion.
     *
     * This method defines a relationship between the BodegaDenominacion model and the Bodega model.
     * It specifies that a bodega_denominacion record belongs to one bodega.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function bodega()
    {
        return $this->belongsTo(Bodega::class, 'bodega_id');
    }

    /**
     * Get the denominacion associated with the bodega_denominacion.
     *
     * This method defines a relationship between the BodegaDenominacion model and the Denominacion model.
     * It specifies that a bodega_denominacion record belongs to one denominacion.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function denominacion()
    {
        return $this->belongsTo(Denominacion::class, 'denominacion_id');
    }
}
