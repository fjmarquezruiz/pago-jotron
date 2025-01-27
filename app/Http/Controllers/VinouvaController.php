<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVinoUvaRequest;
use App\Models\Vino;
use App\Models\VinoUva;
use Illuminate\Support\Facades\Log;

class VinoUvaController extends Controller
{
    /**
     * Display a listing of the vino_uvas for a specific vino.
     *
     * @param  \App\Models\Vino  $vino - The vino model instance.
     * @return \Illuminate\Http\JsonResponse - The JSON response with the list of vino_uvas.
     */
    public function index(Vino $vino)
    {
        Log::info('INDEX VINOUVA Vino: ' . json_encode($vino));

        try {
            $vinoUvas = $vino->uvas()->withPivot('percent')->get();
            return response()->json($vinoUvas);
        } catch (\Exception $e) {
            Log::error('Failed to get vino_uvas: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get vino_uvas.'], 500);
        }
    }

    /**
     * Store a newly created vino_uva association in storage.
     *
     * @param  \App\Http\Requests\StoreVinoUvaRequest  $request - The validated request data.
     * @param  \App\Models\Vino  $vino - The vino model instance.
     * @return \Illuminate\Http\JsonResponse - The JSON response with the created vino_uva.
     */
    public function store(StoreVinoUvaRequest $request, Vino $vino)
    {
        Log::info('STORE VINOUVA Request: ' . json_encode($request->all()));
        Log::info('STORE VINOUVA Vino: ' . json_encode($vino));

        $validatedData = $request->validated();

        // var_dump($request, [$vino]);
        // var_dump($validatedData);
        // exit;

        try {
            $vinoUva = VinoUva::create([
                'vino_id' => $vino->id,
                'uva_id' => $validatedData['uva_id'],
                'percent' => $validatedData['percent'],
            ]);

            return response()->json(['message' => 'VinoUva created successfully.', 'data' => $vinoUva], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create vino_uva: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create vino_uva.'], 500);
        }
    }

    /**
     * Update the specified vino_uva association in storage.
     *
     * @param  \App\Http\Requests\StoreVinoUvaRequest  $request - The validated request data.
     * @param  \App\Models\Vino  $vino - The vino model instance.
     * @param  \App\Models\VinoUva  $vinoUva - The vino_uva model instance.
     * @return \Illuminate\Http\JsonResponse - The JSON response with the updated vino_uva.
     */
    public function update(StoreVinoUvaRequest $request, Vino $vino, VinoUva $vinoUva)
    {
        Log::info('VINOUVA UPDATE Request: ' . json_encode($request->all()));
        Log::info('VINOUVA UPDATE Vino: ' . json_encode($vino));
        Log::info('VINOUVA UPDATE VinoUva: ' . json_encode($vinoUva));

        $validatedData = $request->validated();

        // var_dump($request, [$vinoUva, $vino]);
        // var_dump($validatedData);
        // exit;

        try {
            $vinoUva->update([
                'percent' => $validatedData['percent']
            ]);

            return response()->json(['message' => 'VinoUva updated successfully.', 'data' => $vinoUva]);
        } catch (\Exception $e) {
            Log::error('Failed to update vino_uva: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update vino_uva.'], 500);
        }
    }

    /**
     * Remove the specified vino_uva association from storage.
     *
     * @param  \App\Models\Vino  $vino - The vino model instance.
     * @param  \App\Models\VinoUva  $vinoUva - The vino_uva model instance.
     * @return \Illuminate\Http\JsonResponse - The JSON response indicating successful deletion.
     */
    public function destroy(Vino $vino, VinoUva $vinoUva)
    {
        Log::info('DESTROY VINOUVA $vinoUva: ' . json_encode($$vinoUva));
        Log::info('DESTROY VINOUVA Vino: ' . json_encode($vino));

        try {
            $vinoUva->delete();
            return response()->json(['message' => 'VinoUva deleted successfully.']);
        } catch (\Exception $e) {
            Log::error('Failed to delete vino_uva: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete vino_uva.'], 500);
        }
    }
}
