<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBodegaRequest;
use App\Http\Resources\BodegaResource;
use App\Models\Bodega;
use App\Models\BodegaDenominacion;
use App\Models\Vino;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Exception;

class BodegaController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $paginated = Bodega::latest()->paginate();

        return Inertia::render('Dashboard/Bodega/Index', [
            'bodegas' => BodegaResource::collection($paginated)
        ]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        return Inertia::render('Dashboard/Bodega/Create');
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \App\Http\Requests\StoreBodegaRequest  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(StoreBodegaRequest $request)
    {
        $validatedData = $request->validated();
        $denominacionData = $request->input('denominaciones', []);

        try {
            $bodega = Bodega::create($validatedData);

            $this->handleBodegaDenominaciones($bodega, $denominacionData);

            return Redirect::route('bodega.index')->with('success', 'Bodega created successfully.');
        } catch (Exception $e) {
            Log::error('Failed to create bodega: ' . $e->getMessage(), ['exception' => $e]);
            return Redirect::back()->with('error', 'Failed to create bodega. ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Bodega  $bodega
     * @return \Inertia\Response
     */
    public function show(Bodega $bodega)
    {
        return Inertia::render('Dashboard/Bodega/Show', [
            'bodega' => new BodegaResource($bodega)
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\Bodega  $bodega
     * @return \Inertia\Response
     */
    public function edit(Bodega $bodega)
    {
        return Inertia::render('Dashboard/Bodega/Edit', [
            'bodega' => new BodegaResource($bodega)
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \App\Http\Requests\StoreBodegaRequest  $request
     * @param  \App\Models\Bodega  $bodega
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(StoreBodegaRequest $request, Bodega $bodega)
    {
        $validatedData = $request->validated();
        $denominacionData = $request->input('denominaciones', []);

        try {
            DB::beginTransaction();

            // Update the bodega record
            $bodega->update($validatedData);

            $this->handleBodegaDenominaciones($bodega, $denominacionData);

            // Get the new blocked status from the validated data
            $newBlockedStatus = $validatedData['blocked'] ?? false;

            // Update the blocked status of all associated vinos
            Vino::where('bodega_id', $bodega->id)->update(['blocked' => $newBlockedStatus]);

            DB::commit();

            return Redirect::route('bodega.index')->with('success', 'Bodega updated successfully.');
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Failed to update bodega: ' . $e->getMessage(), ['exception' => $e]);
            return Redirect::back()->with('error', 'Failed to update bodega.');
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Bodega  $bodega
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Bodega $bodega)
    {
        try {
            $bodega->delete();

            return Redirect::route('bodega.index')->with('success', 'Bodega deleted successfully.');
        } catch (Exception $e) {
            Log::error('Failed to delete bodega: ' . $e->getMessage(), ['exception' => $e]);
            return Redirect::back()->with('error', 'Failed to delete bodega.');
        }
    }

    /**
     * Return all bodegas without pagination.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function all()
    {
        $bodegas = Bodega::all();

        return BodegaResource::collection($bodegas)->response();
    }

    /**
     * Handle the relationship between bodega and denominaciones.
     *
     * @param  \App\Models\Bodega  $bodega
     * @param  array  $denominacionData
     * @return void
     * @throws \Exception
     */
    private function handleBodegaDenominaciones(Bodega $bodega, array $denominacionData)
    {
        // Start a transaction
        DB::beginTransaction();
        try {
            // Clear existing relationships
            $bodega->bodegaDenominaciones()->delete();

            foreach ($denominacionData as $denominacion) {
                if (!isset($denominacion['id'])) {
                    throw new Exception('Invalid data for denominacion ID ' . ($denominacion['id'] ?? 'unknown'));
                }

                BodegaDenominacion::create([
                    'bodega_id' => $bodega->id,
                    'denominacion_id' => $denominacion['id'],
                ]);
            }

            // Commit the transaction
            DB::commit();
        } catch (Exception $e) {
            // Rollback the transaction if something went wrong
            DB::rollBack();
            Log::error('Failed to create save bodega_denominaciones: ' . $e->getMessage(), ['exception' => $e]);
            throw $e; // Re-throw the exception for further handling
        }
    }
}
