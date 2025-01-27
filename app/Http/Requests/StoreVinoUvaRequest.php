<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVinoUvaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            // 'uvas' => 'required|array',
            // 'uvas.*.id' => 'required|exists:uvas,id',
            // 'uvas.*.pivot.percent' => 'required|numeric|min:0|max:100',
            'uvas.*.uva_id' => 'required|exists:uvas,id',
            'uvas.*.percent' => 'required|numeric|min:0|max:100',
        ];
    }

    public function messages()
    {
        return [
            'uvas.*.uva_id.required' => 'The uva variety is required.',
            'uvas.*.uva_id.exists' => 'The selected uva variety does not exist.',
            'uvas.*.percent.required' => 'The percentage is required.',
            'uvas.*.percent.numeric' => 'The percentage must be a number.',
            'uvas.*.percent.min' => 'The percentage must be at least 0.',
            'uvas.*.percent.max' => 'The percentage must not exceed 100.',
        ];
    }
}
