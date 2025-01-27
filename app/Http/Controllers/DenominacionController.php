<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDenominacionRequest;
use App\Http\Resources\DenominacionResource;
use App\Models\Denominacion;
use Exception;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;

class DenominacionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $paginated = Denominacion::latest()->paginate();

        return Inertia::render('Denominacion/Index', [
            'denominaciones' => DenominacionResource::collection($paginated)
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Denominacion/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreDenominacionRequest $request)
    {
        $validatedData = $request->validated();

        try {
            Denominacion::create($validatedData);

            return Redirect::route('denominacion.index')->with('success', 'Origin denomination created successfully.');
        } catch (Exception $e) {
            Log::error('Failed to create origin denomination: ' . $e->getMessage(), ['exception' => $e]);
            return Redirect::back()->with('error', 'Failed to create origin denomination. ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Denominacion $denominacion)
    {
        return Inertia::render('Denominacion/Show', [
            'denominacion' => new DenominacionResource($denominacion)
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Denominacion $denominacion)
    {
        return Inertia::render('Denominacion/Edit', [
            'denominacion' => new DenominacionResource($denominacion)
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StoreDenominacionRequest $request, Denominacion $denominacion)
    {
        $validatedData = $request->validated();

        try {
            // Update the UVDenominacionA record in the database
            $denominacion->update($validatedData);

            // Redirect to the Denominacion index page with a success message
            return Redirect::route('denominacion.index')->with('success', 'Origin denomination updated successfully.');
        } catch (Exception $e) {
            // Log the error and redirect back with an error message
            Log::error('Failed to update origin denomination: ' . $e->getMessage(), ['exception' => $e]);
            return Redirect::back()->with('error', 'Failed to update origin denomination.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Denominacion $denominacion)
    {
        try {
            // Delete the Denominacion record from the database
            $denominacion->delete();

            // Redirect to the Denominacion index page with a success message
            return Redirect::route('denominacion.index')->with('success', 'Origin denomination deleted successfully.');
        } catch (Exception $e) {
            // Log the error and redirect back with an error message
            Log::error('Failed to delete origin denomination: ' . $e->getMessage(), ['exception' => $e]);
            return Redirect::back()->with('error', 'Failed to delete origin denomination.');
        }
    }

    /**
     * Return all denominations as JSON.
     */
    public function all(): JsonResponse
    {
        $denominaciones = Denominacion::all();

        return DenominacionResource::collection($denominaciones)->response();
    }
}
