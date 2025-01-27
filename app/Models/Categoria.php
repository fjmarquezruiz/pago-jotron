<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Categoria Model
 *
 * Represents the categorias table in the database.
 * Each categoria can have multiple vinos.
 *
 * @property int $id
 * @property string $name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Vino> $vinos
 * @method static \Database\Factories\CategoriaFactory factory(...$parameters)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Categoria newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Categoria newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Categoria query()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Categoria whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Categoria whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Categoria whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Categoria whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Categoria extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * This specifies the name of the database table that this model corresponds to.
     *
     * @var string
     */
    protected $table = 'categorias';

    /**
     * The attributes that are mass assignable.
     *
     * These are the fields that can be filled when creating or updating a Categoria instance.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
    ];

    /**
     * Get the vinos for the categoria.
     *
     * This method defines a one-to-many relationship between the Categoria model and the Vino model.
     * It specifies that a categoria can have multiple vinos.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function vinos()
    {
        return $this->hasMany(Vino::class);
    }
}
