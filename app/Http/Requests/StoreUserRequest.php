<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check(); // Use the Auth facade to check if the user is authenticated
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->route('user') ? $this->route('user')->id : null;

        $rules = [
            'name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'date_of_birth' => ['required', 'date'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($userId),
            ],
            'password' => [
                'required',
                'string',
                'min:8',
            ],
            'id_card' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique(User::class)->ignore($userId),
            ],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'account_status' => ['required', 'boolean'],
            'age_verified' => ['required', 'boolean'],
            'roles' => ['required', 'array'],
            // 'roles.*' => ['exists:roles,id'], // Ensure each role exists in the roles table
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
            'last_name.required' => 'The last name field is required.',
            'last_name.string' => 'The last name must be a string.',
            'last_name.max' => 'The last name may not be greater than 100 characters.',
            'date_of_birth.required' => 'The date of birth field is required.',
            'date_of_birth.date' => 'The date of birth must be a valid date.',
            'email.required' => 'The email field is required.',
            'email.string' => 'The email must be a string.',
            'email.lowercase' => 'The email must be lowercase.',
            'email.email' => 'The email must be a valid email address.',
            'email.max' => 'The email may not be greater than 255 characters.',
            'email.unique' => 'The email has already been taken.',
            'password.required' => 'The password field is required.',
            'password.string' => 'The password must be a string.',
            'password.min' => 'The password must be at least 8 characters.',
            'id_card.string' => 'The ID card must be a string.',
            'id_card.max' => 'The ID card may not be greater than 20 characters.',
            'id_card.unique' => 'The ID card has already been taken.',
            'phone_number.string' => 'The phone number must be a string.',
            'phone_number.max' => 'The phone number may not be greater than 20 characters.',
            'account_status.required' => 'The account status field is required.',
            'account_status.boolean' => 'The account status must be true or false.',
            'age_verified.required' => 'The age verified field is required.',
            'age_verified.boolean' => 'The age verified must be true or false.',
            'roles.required' => 'The roles field is required.',
            'roles.array' => 'The roles must be an array.',
            // 'roles.*.exists' => 'One or more selected roles do not exist.',
        ];
    }
}
