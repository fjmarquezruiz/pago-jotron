<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Direccion Model
 *
 * Represents the direcciones table in the database.
 * Each direccion is associated with one user.
 *
 * @property int $id
 * @property string $phone
 * @property string $street_type
 * @property string $street_name
 * @property string $street_number
 * @property string $postal_code
 * @property string $locality
 * @property string $province
 * @property string $country
 * @property string $address_type
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read \App\Models\User $user
 * @method static \Database\Factories\DireccionFactory factory(...$parameters)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Direccion newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Direccion newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Direccion query()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Direccion whereAddressType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Direccion whereCountry($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Direccion whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Direccion whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Direccion whereLocality($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Direccion wherePhone($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Direccion wherePostalCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Direccion whereProvince($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Direccion whereStreetName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Direccion whereStreetNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Direccion whereStreetType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Direccion whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Direccion extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * This specifies the name of the database table that this model corresponds to.
     *
     * @var string
     */
    protected $table = 'direcciones';

    /**
     * The attributes that are mass assignable.
     *
     * These are the fields that can be filled when creating or updating a Direccion instance.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'phone',
        'street_type',
        'street_name',
        'street_number',
        'postal_code',
        'locality',
        'province',
        'country',
        'address_type',
    ];

    /**
     * Define the relationship with the User model.
     *
     * This method defines a relationship between the Direccion model and the User model.
     * It specifies that a direccion belongs to one user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
