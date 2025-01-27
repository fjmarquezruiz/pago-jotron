<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Denominacion Model
 *
 * Represents the denominaciones table in the database.
 * Each denominacion can be associated with multiple bodegas and can have multiple vinos.
 *
 * @property int $id
 * @property string $name
 * @property bool $blocked
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Bodega> $bodegas
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Vino> $vinos
 * @method static \Database\Factories\DenominacionFactory factory(...$parameters)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Denominacion newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Denominacion newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Denominacion query()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Denominacion whereBlocked($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Denominacion whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Denominacion whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Denominacion whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Denominacion whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Denominacion extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * This specifies the name of the database table that this model corresponds to.
     *
     * @var string
     */
    protected $table = 'denominaciones';

    /**
     * The attributes that are mass assignable.
     *
     * These are the fields that can be filled when creating or updating a Denominacion instance.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'blocked',
    ];

    /**
     * Get the bodegas associated with the denominacion.
     *
     * This method defines a many-to-many relationship between the Denominacion model and the Bodega model.
     * It specifies that a denominacion can be associated with multiple bodegas.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function bodegas()
    {
        return $this->belongsToMany(Bodega::class, 'bodega_denominaciones', 'denominacion_id', 'bodega_id');
    }

    /**
     * Get the vinos for the denominacion.
     *
     * This method defines a one-to-many relationship between the Denominacion model and the Vino model.
     * It specifies that a denominacion can have multiple vinos.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function vinos()
    {
        return $this->hasMany(Vino::class);
    }
}
