<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\VinoResource;

class BodegaResource extends JsonResource
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
            'name' => $this->name,
            'city' => $this->city,
            'province' => $this->province,
            'blocked' => $this->blocked,
            'denominaciones' => DenominacionResource::collection($this->whenLoaded('denominaciones')),
            'vinos' => VinoResource::collection($this->whenLoaded('vinos')),
            'vinos_count' => $this->vinos_count,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}