<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Vino Model
 *
 * Represents the vinos table in the database.
 * Each vino belongs to one bodega, one denominacion, and one categoria.
 *
 * @property int $id
 * @property string $name
 * @property float $price
 * @property int $stock
 * @property int|null $vintage_year
 * @property string|null $image
 * @property string|null $image_url
 * @property string|null $description
 * @property string|null $visual
 * @property string|null $aromas
 * @property string|null $taste
 * @property int|null $capacity
 * @property float|null $minimum_temperature
 * @property float|null $maximum_temperature
 * @property float|null $alcohol
 * @property string|null $food_pairing
 * @property bool $blocked
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property int $bodega_id
 * @property int $denominacion_id
 * @property int $categoria_id
 * @property-read \App\Models\Bodega $bodega
 * @property-read \App\Models\Denominacion $denominacion
 * @property-read \App\Models\Categoria $categoria
 * @method static \Database\Factories\VinoFactory factory(...$parameters)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino query()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereAlcohol($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereAromas($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereBlocked($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereCapacity($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereDenominacionId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereFoodPairing($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereImage($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereImageUrl($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereMaximumTemperature($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereMinimumTemperature($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino wherePrice($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereStock($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereTaste($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereVintageYear($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereVisual($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereBodegaId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Vino whereCategoriaId($value)
 * @mixin \Eloquent
 */
class Vino extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * This specifies the name of the database table that this model corresponds to.
     *
     * @var string
     */
    protected $table = 'vinos';

    /**
     * The attributes that are mass assignable.
     *
     * These are the fields that can be filled when creating or updating a Vino instance.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'price',
        'stock',
        'vintage_year',
        'image',
        'image_url',
        'description',
        'visual',
        'aromas',
        'taste',
        'capacity',
        'minimum_temperature',
        'maximum_temperature',
        'alcohol',
        'food_pairing',
        'blocked',
        'bodega_id',
        'denominacion_id',
        'categoria_id',
    ];

    /**
     * Get the bodega that owns the vino.
     *
     * This method defines a relationship between the Vino model and the Bodega model.
     * It specifies that a vino belongs to one bodega.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function bodega()
    {
        return $this->belongsTo(Bodega::class, 'bodega_id');
    }

    /**
     * Get the denominacion that owns the vino.
     *
     * This method defines a relationship between the Vino model and the Denominacion model.
     * It specifies that a vino belongs to one denominacion.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function denominacion()
    {
        return $this->belongsTo(Denominacion::class, 'denominacion_id');
    }

    /**
     * Get the categoria that owns the vino.
     *
     * This method defines a relationship between the Vino model and the Categoria model.
     * It specifies that a vino belongs to one categoria.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }

    /**
     * Define the many-to-many relationship between Vino and Uva.
     *
     * This method specifies that a Vino can belong to many Uvas through the 'vino_uvas' pivot table.
     * It includes the 'percent' attribute from the pivot table and timestamps.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    // public function uvas2()
    // {
    //     // return $this->belongsToMany(Uva::class, 'vino_uvas')
    //     //     ->withPivot('percent')
    //     //     ->withTimestamps();
    //     return $this->belongsToMany(Uva::class, 'vino_uvas', 'vino_id', 'uva_id')->withPivot('percent');
    // }

    public function uvas()
    {
        // return $this->hasManyThrough(Uva::class, VinoUva::class);
        return $this->belongsToMany(Uva::class, 'vino_uvas')->withPivot('percent')->withTimestamps();
    }

    public function vinoUvas()
    {
        return $this->hasMany(VinoUva::class);
    }
}
