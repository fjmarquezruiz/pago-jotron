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
        // Initialize related resources if they exist, otherwise set to null
        $bodega = $this->bodega ? new BodegaResource($this->bodega) : null;
        $denominacion = $this->denominacion ? new DenominacionResource($this->denominacion) : null;
        $categoria = $this->categoria ? new CategoriaResource($this->categoria) : null;

        // Include uvas relationship
        $uvas = $this->uvas;

        // Return an array representation of the Vino resource
        return [
            'id' => $this->id, // Unique identifier for the vino
            'name' => $this->name, // Name of the vino
            'price' => $this->price, // Price of the vino
            'stock' => $this->stock, // Available stock quantity
            'vintage_year' => $this->vintage_year, // Vintage year of the vino
            'image_url' => $this->image_url, // URL to the image of the vino
            'description' => $this->description, // Description of the vino
            'visual' => $this->visual, // Visual characteristics of the vino
            'aromas' => $this->aromas, // Aromas detected in the vino
            'taste' => $this->taste, // Taste profile of the vino
            'capacity' => $this->capacity, // Bottle capacity of the vino
            'minimum_temperature' => $this->minimum_temperature, // Minimum serving temperature
            'maximum_temperature' => $this->maximum_temperature, // Maximum serving temperature
            'alcohol' => $this->alcohol, // Alcohol content of the vino
            'food_pairing' => $this->food_pairing, // Suggested food pairings
            'blocked' => $this->blocked, // Whether the vino is blocked or not
            'bodega' => $bodega, // Full Bodega resource
            'categoria' => $categoria, // Full Categoria resource
            'denominacion' => $denominacion, // Full Denominacion resource
            'bodega_name' => optional($bodega)->name, // Name of the bodega
            'denominacion_name' => optional($denominacion)->name, // Name of the denominacion
            'categoria_name' => optional($categoria)->name, // Name of the categoria
            'bodega_id' => optional($bodega)->id, // ID of the bodega
            'denominacion_id' => optional($denominacion)->id, // ID of the denominacion
            'categoria_id' => optional($categoria)->id, // ID of the categoria
            'uvas' => $uvas, // Include the uvas relationship
            'created_at' => $this->created_at->format('Y-m-d H:i:s'), // Creation timestamp of the vino record
        ];
    }
}
