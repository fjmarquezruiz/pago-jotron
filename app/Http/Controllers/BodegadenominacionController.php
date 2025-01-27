<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBodegaDenominacionRequest;
use App\Models\Bodega;
use App\Models\BodegaDenominacion;
use Illuminate\Support\Facades\Log;

class BodegaDenominacionController extends Controller
{
    /**
     * Display a listing of the bodega_denominaciones for a specific bodega.
     *
     * @param  \App\Models\Bodega  $bodega - The bodega model instance.
     * @return \Illuminate\Http\JsonResponse - The JSON response with the list of bodega_denominaciones.
     */
    public function index(Bodega $bodega)
    {
        Log::info('INDEX BODEGADENOMINACION Bodega: ' . json_encode($bodega));

        try {
            $bodegaDenominacions = $bodega->get();
            return response()->json($bodegaDenominacions);
        } catch (\Exception $e) {
            Log::error('Failed to get bodega_denominaciones: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get bodega_denominaciones.'], 500);
        }
    }

    /**
     * Store a newly created bodega_denominaciones association in storage.
     *
     * @param  \App\Http\Requests\StoreBodegaDenominacionRequest  $request - The validated request data.
     * @param  \App\Models\Bodega  $bodega - The bodega model instance.
     * @return \Illuminate\Http\JsonResponse - The JSON response with the created bodega_denominaciones.
     */
    public function store(StoreBodegaDenominacionRequest $request, Bodega $bodega)
    {
        Log::info('STORE BodegaDenominacion Request: ' . json_encode($request->all()));
        Log::info('STORE BodegaDenominacion Bodega: ' . json_encode($bodega));

        $validatedData = $request->validated();

        try {
            $bodegaDenominacion = BodegaDenominacion::create([
                'bodega_id' => $bodega->id,
                'denominacion_id' => $validatedData['denominacion_id'],
            ]);

            return response()->json(['message' => 'BodegaDenominacion created successfully.', 'data' => $bodegaDenominacion], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create bodega_denominaciones: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create bodega_denominaciones.'], 500);
        }
    }

    /**
     * Update the specified bodega_denominaciones association in storage.
     *
     * @param  \App\Http\Requests\StoreBodegaDenominacionRequest  $request - The validated request data.
     * @param  \App\Models\Bodega  $bodega - The bodega model instance.
     * @param  \App\Models\BodegaDenominacion  $bodegaDenominacion - The bodega_denominaciones model instance.
     * @return \Illuminate\Http\JsonResponse - The JSON response with the updated bodega_denominaciones.
     */
    public function update(StoreBodegaDenominacionRequest $request, Bodega $bodega, BodegaDenominacion $bodegaDenominacion)
    {
        Log::info('BodegaDenominacion UPDATE Request: ' . json_encode($request->all()));
        Log::info('BodegaDenominacion UPDATE Bodega: ' . json_encode($bodega));
        Log::info('BodegaDenominacion UPDATE BodegaDenominacion: ' . json_encode($bodegaDenominacion));

        $validatedData = $request->validated();

        try {
            // Ensure the bodegaDenominacion belongs to the given bodega
            if ($bodegaDenominacion->bodega_id !== $bodega->id) {
                return response()->json(['error' => 'BodegaDenominacion does not belong to the specified bodega.'], 404);
            }

            $bodegaDenominacion->update([
                'denominacion_id' => $validatedData['denominacion_id'],
            ]);

            return response()->json(['message' => 'BodegaDenominacion updated successfully.', 'data' => $bodegaDenominacion]);
        } catch (\Exception $e) {
            Log::error('Failed to update bodega_denominaciones: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update bodega_denominaciones.'], 500);
        }
    }

    /**
     * Remove the specified bodega_denominaciones association from storage.
     *
     * @param  \App\Models\Bodega  $bodega - The bodega model instance.
     * @param  \App\Models\BodegaDenominacion  $bodegaDenominacion - The bodega_denominaciones model instance.
     * @return \Illuminate\Http\JsonResponse - The JSON response indicating successful deletion.
     */
    public function destroy(Bodega $bodega, BodegaDenominacion $bodegaDenominacion)
    {
        Log::info('DESTROY BODEGADENOMINACION $bodegaDenominacion: ' . json_encode($bodegaDenominacion));
        Log::info('DESTROY BODEGADENOMINACION $bodega: ' . json_encode($bodega));

        try {
            // Ensure the bodegaDenominacion belongs to the given bodega
            if ($bodegaDenominacion->bodega_id !== $bodega->id) {
                return response()->json(['error' => 'BodegaDenominacion does not belong to the specified bodega.'], 404);
            }

            $bodegaDenominacion->delete();
            return response()->json(['message' => 'BodegaDeno deleted successfully.']);
        } catch (\Exception $e) {
            Log::error('Failed to delete bodega_denominaciones: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete bodega_denominaciones.'], 500);
        }
    }
}
