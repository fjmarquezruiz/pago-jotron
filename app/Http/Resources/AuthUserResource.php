<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthUserResource extends JsonResource
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
            'last_name' => $this->last_name, // User name
            'date_of_birth' => $this->date_of_birth->format('Y-m-d'),
            'email' => $this->email, // User email
            'email_verified_at' => $this->email_verified_at, // Timestamp of email verification
            'id_card' => $this->id_card,
            'phone_number' => $this->phone_number,
            'account_status' => $this->account_status,
            'age_verified' => $this->age_verified,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'permissions' => $this->getAllPermissions()->map(function ($permission) {
                return $permission->name; // Map permissions to their names
            }),
            'roles' => $this->getRoleNames(), // Get role names associated with the user
        ];
    }
}
