<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    // Disable wrapping of the resource in a root element
    public static $wrap = false;

    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // return parent::toArray($request);

        // Return a custom array representation of the resource
        return [
            'id' => $this->id, // User ID
            'name' => $this->name, // User name
            'email' => $this->email, // User email
        ];
    }
}
