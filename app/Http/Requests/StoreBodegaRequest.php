<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreBodegaRequest extends FormRequest
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
        $rules = [
            'name' => ['required', 'string', 'max:100'], // Name must be a required string with a maximum length of 100 characters.
            'city' => ['nullable', 'string', 'max:100'], // City can be null, but if provided, it must be a required string with a maximum length of 100 characters.
            'province' => ['nullable', 'string', 'max:100'], // Province can be null, but if provided, it must be a required string with a maximum length of 100 characters.
            'blocked' => ['nullable', 'boolean'], // Blocked status can be null, but if provided, it must be a boolean value.
            'denominaciones' => 'nullable|array',
        ];

        // Add nested validation rules for denominaciones if it is present
        if ($this->has('denominaciones')) {
            $rules['denominaciones.*.id'] = ['required', 'integer'];
            $rules['denominaciones.*.name'] = ['required', 'string'];
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
        return [
            'name.required' => 'The name field is required.',
            'name.string' => 'The name must be a string.',
            'name.max' => 'The name may not be greater than 100 characters.',
            'city.string' => 'The name must be a string.',
            'city.max' => 'The name may not be greater than 100 characters.',
            'province.string' => 'The name must be a string.',
            'province.max' => 'The name may not be greater than 100 characters.',
            'blocked.boolean' => 'The blocked field must be a boolean.',
        ];
    }
}
