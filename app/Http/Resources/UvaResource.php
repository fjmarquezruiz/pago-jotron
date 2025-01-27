<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Class UvaResource
 *
 * A resource class to transform a Uva model instance into an array for JSON responses.
 * This class includes relationships with Vino models.
 */
class UvaResource extends JsonResource
{
    // Disables wrapping the response in a data key
    public static $wrap = false;

    /**
     * Transform the resource into an array.
     *
     * This method is responsible for converting the Uva model attributes and related models
     * into a structured array that can be easily converted to JSON.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Return an array representation of the Uva resource
        return [
            'id' => $this->id, // Unique identifier for the uva
            'name' => $this->name, // Name of the uva
            'created_at' => $this->created_at->format('Y-m-d H:i:s'), // Creation timestamp of the uva record
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'), // Update timestamp of the uva record
        ];
    }
}
