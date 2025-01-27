<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

/**
 * Request class for validating vino data during store and update operations.
 */
class StoreVinoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool - True if the user is authorized, false otherwise.
     */
    public function authorize(): bool
    {
        // Example authorization logic: Only authenticated users can make this request.
        return Auth::check(); // Use the Auth facade to check if the user is authenticated
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $currentYear = Carbon::now()->year;

        $rules = [
            'name' => ['required', 'string', 'max:100'], // Name must be a required string with a maximum length of 100 characters.
            'price' => ['required', 'numeric', 'min:0'], // Price must be a required numeric value with a minimum value of 0.
            'stock' => ['required', 'integer', 'min:0'], // Stock must be a required integer with a minimum value of 0.
            'vintage_year' => [
                'nullable',
                'integer',
                'digits:4',
                function ($attribute, $value, $fail) use ($currentYear) {
                    if ($value && $value > $currentYear) {
                        $fail("The {$attribute} must be lower than the current year ({$currentYear}).");
                    }
                },
            ], // Vintage year can be null, but if provided, it must be a 4-digit integer and no higher than the current year.
            'image_url' => ['nullable', 'string'], // Image URL can be null, but if provided, it must be a valid URL.
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg', 'max:2048'], // Image can be null, but if provided, it must be a valid image file with specific MIME types and a maximum size of 2048 KB.
            'description' => ['nullable', 'string', 'max:1000'], // Description can be null, but if provided, it must be a string with a maximum length of 1000 characters.
            'visual' => ['nullable', 'string', 'max:1000'], // Visual description can be null, but if provided, it must be a string with a maximum length of 1000 characters.
            'aromas' => ['nullable', 'string', 'max:1000'], // Aromas description can be null, but if provided, it must be a string with a maximum length of 1000 characters.
            'taste' => ['nullable', 'string', 'max:1000'], // Taste description can be null, but if provided, it must be a string with a maximum length of 1000 characters.
            'capacity' => ['nullable', 'integer', 'min:0'], // Capacity can be null, but if provided, it must be a non-negative integer.
            'minimum_temperature' => ['nullable', 'numeric', 'between:-50,50', function ($attribute, $value, $fail) {
                $maxTemp = $this->input('maximum_temperature');
                if ($value !== null && $maxTemp !== null && $value > $maxTemp) {
                    $fail('The minimum temperature must be less than or equal to the maximum temperature.');
                }
            },], // Minimum temperature can be null, but if provided, it must be a numeric value between -50 and 50.
            'maximum_temperature' => [
                'nullable',
                'numeric',
                'between:-50,50',
                function ($attribute, $value, $fail) {
                    $minTemp = $this->input('minimum_temperature');
                    if ($value !== null && $minTemp !== null && $value < $minTemp) {
                        $fail('The maximum temperature must be greater than or equal to the minimum temperature.');
                    }
                },
            ], // Maximum temperature can be null, but if provided, it must be a numeric value between -50 and 50.
            'alcohol' => ['nullable', 'numeric', 'between:0,100'], // Alcohol content can be null, but if provided, it must be a numeric value between 0 and 100.
            'food_pairing' => ['nullable', 'string', 'max:1000'], // Food pairing description can be null, but if provided, it must be a string with a maximum length of 1000 characters.
            'blocked' => ['nullable', 'boolean'], // Blocked status can be null, but if provided, it must be a boolean value.
            'bodega_id' => ['required', 'exists:bodegas,id'], // Bodega ID must be a required integer that exists in the bodegas table.
            'denominacion_id' => ['required', 'exists:denominaciones,id'], // Denominación ID must be a required integer that exists in the denominaciones table.
            'categoria_id' => ['required', 'exists:categorias,id'], // Categoría ID must be a required integer that exists in the categorias table.
            'uvas' => 'nullable|array',
        ];

        // Additional validation for update scenario
        // if ($this->isMethod('put') || $this->isMethod('patch')) {
        //     $rules['minimum_temperature'][] = 'lte:maximum_temperature'; // Minimum temperature must be less than or equal to maximum temperature.
        //     $rules['maximum_temperature'][] = 'gte:minimum_temperature'; // Maximum temperature must be greater than or equal to minimum temperature.
        // }

        // Add nested validation rules for uvas if it is present
        if ($this->has('uvas')) {
            $rules['uvas.*.id'] = ['required', 'integer'];
            // $rules['uvas.*.pivot.vino_id'] = ['required', 'integer'];
            $rules['uvas.*.pivot.percent'] = ['required', 'numeric', 'between:0,100'];
        }

        return $rules;
    }

    /**
     * Get the custom validation messages for the request.
     *
     * @return array<string, string>
     *         An associative array of custom validation messages for each validation rule.
     */
    public function messages(): array
    {
        $currentYear = Carbon::now()->year;

        return [
            'name.required' => 'The name field is required.',
            'name.string' => 'The name must be a string.',
            'name.max' => 'The name may not be greater than 100 characters.',
            'price.required' => 'The price field is required.',
            'price.numeric' => 'The price must be a number.',
            'price.min' => 'The price must be at least 0.',
            'stock.required' => 'The stock field is required.',
            'stock.integer' => 'The stock must be an integer.',
            'stock.min' => 'The stock must be at least 0.',
            'vintage_year.integer' => 'The vintage year must be an integer.',
            'vintage_year.digits' => 'The vintage year must be 4 digits.',
            'vintage_year.custom' => 'The vintage year must be greater than the current year (' . $currentYear . ').',
            'image.file' => 'The image must be a file.',
            'image.image' => 'The image must be an image file.',
            'image.mimes' => 'The image must be a file of type: jpeg, png, jpg, gif, svg.',
            'image.max' => 'The image may not be greater than 2048 kilobytes.',
            'description.string' => 'The description must be a string.',
            'description.max' => 'The description may not be greater than 1000 characters.',
            'visual.string' => 'The visual must be a string.',
            'visual.max' => 'The visual may not be greater than 1000 characters.',
            'aromas.string' => 'The aromas must be a string.',
            'aromas.max' => 'The aromas may not be greater than 1000 characters.',
            'taste.string' => 'The taste must be a string.',
            'taste.max' => 'The taste may not be greater than 1000 characters.',
            'capacity.integer' => 'The capacity must be an integer.',
            'capacity.min' => 'The capacity must be at least 0.',
            'minimum_temperature.numeric' => 'The minimum temperature must be a number.',
            'minimum_temperature.between' => 'The minimum temperature must be between -50 and 50.',
            'minimum_temperature.custom' => 'The minimum temperature must be less than or equal to the maximum temperature.',
            'maximum_temperature.numeric' => 'The maximum temperature must be a number.',
            'maximum_temperature.between' => 'The maximum temperature must be between -50 and 50.',
            'maximum_temperature.custom' => 'The maximum temperature must be greater than or equal to the minimum temperature.',
            'alcohol.numeric' => 'The alcohol must be a number.',
            'alcohol.between' => 'The alcohol must be between 0 and 100.',
            'food_pairing.string' => 'The food pairing must be a string.',
            'food_pairing.max' => 'The food pairing may not be greater than 1000 characters.',
            'blocked.boolean' => 'The blocked field must be a boolean.',
            'bodega_id.required' => 'The bodega ID field is required.',
            'bodega_id.exists' => 'The selected bodega ID is invalid.',
            'denominacion_id.required' => 'The denominación ID field is required.',
            'denominacion_id.exists' => 'The selected denominación ID is invalid.',
            'categoria_id.required' => 'The categoría ID field is required.',
            'categoria_id.exists' => 'The selected categoría ID is invalid.',
            'image_url.url' => 'The image URL must be a valid URL.',
            'uvas.array' => 'The uvas field must be an array.',
            'uvas.*.id.required' => 'The id field is required for each uva item.',
            'uvas.*.id.integer' => 'The id field must be an integer for each uva item.',
            'uvas.*.pivot.vino_id.required' => 'The vino_id field is required for each uva pivot.',
            'uvas.*.pivot.vino_id.integer' => 'The vino_id field must be an integer for each uva pivot.',
            'uvas.*.pivot.percent.required' => 'The percent field is required for each uva pivot.',
            'uvas.*.pivot.percent.numeric' => 'The percent field must be a number for each uva pivot.',
            'uvas.*.pivot.percent.between' => 'The percent field must be between 0 and 100 for each uva pivot.',
        ];
    }
}
