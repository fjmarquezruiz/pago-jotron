<?php

namespace App\Http\Controllers;

use App\Models\Direccion;
use Illuminate\Http\Request;
use App\Http\Resources\DireccionResource;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use Illuminate\Http\Response;

class DireccionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return DireccionResource::collection(auth()->user()->direcciones);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
    //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate the request data
        $validatedData = $request->validate([
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'state' => 'required|string|max:255',
            'postal_code' => 'required|string|max:20',
            'country' => 'required|string|max:255',
            'address_type' => 'required|in:Shipping,Billing',
        ]);

        // Create a new direccion linked to the authenticated user
        $direccion = $request->user()->direcciones()->create($validatedData);

        // Return the created direccion as a resource
        return new DireccionResource($direccion);
    }

    /**
     * Display the specified resource.
     */
    public function show(Direccion $direccion)
    {
        $this->authorize('view', $direccion);

        // Return the specified direccion as a resource
        return new DireccionResource($direccion);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Direccion $direccion)
    {
        $this->authorize('update', $direccion);
    //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Direccion $direccion)
    {
        $this->authorize('update', $direccion);

        // Validate the request data
        $validatedData = $request->validate([
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:255',
            'address_type' => 'nullable|in:Shipping,Billing',
        ]);

        // Update the specified direccion
        $direccion->update($validatedData);

        // Return the updated direccion as a resource
        return new DireccionResource($direccion);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Direccion $direccion)
    {
        $this->authorize('delete', $direccion);

        // Delete the specified direccion
        $direccion->delete();

        // Return a success response
        return response()->json(['message' => 'Direccion deleted successfully']);
    }

    /**
     * Get all directions for the authenticated user.
     *
     * @return JsonResponse
     */
    public function getAllDirectionsForUser(): JsonResponse
    {
        $user = auth()->user();

        // Retrieve all directions for the user
        $direccionesData = $user->direcciones;

        // Return the directions as a collection of resources
        return DireccionResource::collection($direccionesData)->response();
    }

    /**
     * Get the main shipping direction for the authenticated user.
     *
     * @return JsonResponse
     */
    public function getMainShippingDirectionForUser(): JsonResponse
    {
        $user = auth()->user();

        // Retrieve the main shipping direction for the user
        $mainShippingDirection = $user->direcciones()->where('address_type', 'Shipping')->first();

        if (!$mainShippingDirection) {
            return response()->json(['message' => 'Main shipping direction not found'], 404);
        }

        // Convert the DireccionResource to a JsonResponse
        return response()->json(new DireccionResource($mainShippingDirection));
    }
}