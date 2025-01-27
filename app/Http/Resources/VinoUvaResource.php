<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VinoUvaResource extends JsonResource
{
    public static $wrap = false;

    public function toArray(Request $request): array
    {
        return [
            'uva_id' => $this->uva_id,
            'uva_name' => $this->uva->name,
            'percent' => $this->percent,
        ];
    }
}
