<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\BodegaResource;
use App\Http\Resources\DenominacionResource;
use App\Http\Resources\CategoriaResource;

/**
 * Class VinoResource
 *
 * A resource class to transform a Vino model instance into an array for JSON responses.
 * This class includes relationships with Bodega, Denominacion, and Categoria models.
 */
class VinoResource extends JsonResource
{
    // Disables wrapping the response in a data key
    public static $wrap = false;

    /**
     * Transform the resource into an array.
     *
     * This method is responsible for converting the Vino model attributes and related models
     * into a structured array that can be easily converted to JSON.
     *
     * @param Request $request The incoming HTTP request.
     * @return array An associative array representing the Vino resource.
     */
    public function toArray(Request $request): array
    {
        // Return an array representation of the Vino resource
        return [
            'id' => $this->id,
            'name' => $this->name,
            'price' => $this->price,
            'stock' => $this->stock,
            'vintage_year' => $this->vintage_year,
            'image_url' => $this->image_url,
            'description' => $this->description,
            'visual' => $this->visual,
            'aromas' => $this->aromas,
            'taste' => $this->taste,
            'capacity' => $this->capacity,
            'minimum_temperature' => $this->minimum_temperature,
            'maximum_temperature' => $this->maximum_temperature,
            'alcohol' => $this->alcohol,
            'food_pairing' => $this->food_pairing,
            'blocked' => $this->blocked,

            // Relationships - Use whenLoaded to prevent N+1 and recursion
            'bodega' => new BodegaResource($this->whenLoaded('bodega')),
            'categoria' => new CategoriaResource($this->whenLoaded('categoria')),
            'denominacion' => new DenominacionResource($this->whenLoaded('denominacion')),
            'uvas' => UvaResource::collection($this->whenLoaded('uvas')),

            // Legacy name/id fields for convenience
            'bodega_name' => $this->bodega ? $this->bodega->name : null,
            'denominacion_name' => $this->denominacion ? $this->denominacion->name : null,
            'categoria_name' => $this->categoria ? $this->categoria->name : null,
            'bodega_id' => $this->bodega_id,
            'denominacion_id' => $this->denominacion_id,
            'categoria_id' => $this->categoria_id,

            'pivot' => $this->pivot,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}