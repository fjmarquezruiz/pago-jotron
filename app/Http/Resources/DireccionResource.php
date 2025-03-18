<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DireccionResource extends JsonResource
{
    /**
     * Prevent the resource from being wrapped in a data array.
     *
     * @var string|null
     */
    public static $wrap = false;

    /**
     * Transform the resource into an array.
     *
     * This method transforms the Bodega model into an array format suitable for API responses.
     * It includes relevant fields such as id, name, city, province, blocked status, and related denominaciones.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'phone' => $this->phone,
            'street_type' => $this->street_type,
            'street_name' => $this->street_name,
            'street_number' => $this->street_number,
            'postal_code' => $this->postal_code,
            'city' => $this->city,
            'state' => $this->state,
            'country' => $this->country,
            'address_type' => $this->address_type,
        ];
    }
}
