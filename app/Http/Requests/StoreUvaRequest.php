<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreUvaRequest extends FormRequest
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
        ];

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
        ];
    }
}
