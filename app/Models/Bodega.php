<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Bodega Model
 *
 * Represents the bodegas table in the database.
 * Each bodega can have multiple vinos and can be associated with multiple denominaciones.
 *
 * @property int $id
 * @property string $name
 * @property string|null $city
 * @property string|null $province
 * @property bool $blocked
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Vino> $vinos
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Denominacion> $denominaciones
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\BodegaDenominacion> $bodegaDenominaciones
 * @method static \Database\Factories\BodegaFactory factory(...$parameters)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Bodega newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Bodega newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Bodega query()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Bodega whereBlocked($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Bodega whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Bodega whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Bodega whereCity($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Bodega whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Bodega whereProvince($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Bodega whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Bodega extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * This specifies the name of the database table that this model corresponds to.
     *
     * @var string
     */
    protected $table = 'bodegas';

    /**
     * The attributes that are mass assignable.
     *
     * These are the fields that can be filled when creating or updating a Bodega instance.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'city',
        'province',
        'blocked',
    ];

    /**
     * Get the vinos for the bodega.
     *
     * This method defines a one-to-many relationship between the Bodega model and the Vino model.
     * It specifies that a bodega can have multiple vinos.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function vinos()
    {
        return $this->hasMany(Vino::class);
    }

    /**
     * Get the denominaciones associated with the bodega.
     *
     * This method defines a many-to-many relationship between the Bodega model and the Denominacion model.
     * It specifies that a bodega can be associated with multiple denominaciones.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function denominaciones()
    {
        return $this->belongsToMany(Denominacion::class, 'bodega_denominaciones', 'bodega_id', 'denominacion_id');
    }

    /**
     * Get the bodega_denominaciones associated with the bodega.
     *
     * This method defines a one-to-many relationship between the Bodega model and the BodegaDenominacion model.
     * It specifies that a bodega can have multiple bodega_denominaciones entries.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function bodegaDenominaciones()
    {
        return $this->hasMany(BodegaDenominacion::class);
    }
}
