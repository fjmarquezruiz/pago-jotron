<?php

namespace App\Http\Middleware;

use App\Http\Resources\AuthUserResource;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Retrieve the authenticated user from the request
        $user = $request->user();

        return [
            // Spread the shared properties defined in the parent class
            ...parent::share($request),

            // Add authentication information
            'auth' => [
                // If a user is authenticated, include a new instance of AuthUserResource
                // Otherwise, set to null
                'user' => $user ? new AuthUserResource($user) : null,
            ],

            // Add Ziggy configuration
            'ziggy' => fn() => [
                // Spread the data from a new instance of the Ziggy class
                ...(new Ziggy)->toArray(),
                // Include the current URL of the request
                'location' => $request->url(),
            ],

            'success' => session('success'),
            'error' => session('error'),
        ];
    }
}
