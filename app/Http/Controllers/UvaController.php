<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUvaRequest;
use App\Http\Resources\UvaResource;
use App\Models\Uva;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Exception;

class UvaController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        // Retrieve paginated list of UVAs with a configurable pagination limit
        $paginationLimit = config('settings.pagination_limit', 15); // Configurable pagination limit
        $paginated = Uva::withCount('vinos')->latest()->paginate($paginationLimit);

        // Render the Inertia.js component with the paginated UVAs
        return Inertia::render('Dashboard/Uva/Index', [
            'uvas' => UvaResource::collection($paginated)
        ]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        // Render the Inertia.js component for creating a new UVA
        return Inertia::render('Dashboard/Uva/Create');
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \App\Http\Requests\StoreUvaRequest  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(StoreUvaRequest $request)
    {
        $validatedData = $request->validated();

        try {
            // Create a new UVA record in the database
            Uva::create($validatedData);

            // Redirect to the UVA index page with a success message
            return Redirect::route('uva.index')->with('success', 'Uva created successfully.');
        }
        catch (Exception $e) {
            // Log the error and redirect back with an error message
            Log::error('Failed to create uva: ' . $e->getMessage(), ['exception' => $e]);
            return Redirect::back()->with('error', 'Failed to create uva. ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     *
     * @param \App\Models\Uva $uva
     * @return \Inertia\Response
     */
    public function show(Uva $uva)
    {
        // Render the Inertia.js component to show the details of a specific UVA
        return Inertia::render('Dashboard/Uva/Show', [
            'uva' => new UvaResource($uva->load(['vinos.bodega', 'vinos.denominacion', 'vinos.categoria']))
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param \App\Models\Uva $uva
     * @return \Inertia\Response
     */
    public function edit(Uva $uva)
    {
        // Render the Inertia.js component for editing a specific UVA
        return Inertia::render('Dashboard/Uva/Edit', [
            'uva' => new UvaResource($uva)
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \App\Http\Requests\StoreUvaRequest $request
     * @param  \App\Models\Uva $uva
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(StoreUvaRequest $request, Uva $uva)
    {
        $validatedData = $request->validated();

        try {
            // Update the UVA record in the database
            $uva->update($validatedData);

            // Redirect to the UVA index page with a success message
            return Redirect::route('uva.index')->with('success', 'Uva updated successfully.');
        }
        catch (Exception $e) {
            // Log the error and redirect back with an error message
            Log::error('Failed to update uva: ' . $e->getMessage(), ['exception' => $e]);
            return Redirect::back()->with('error', 'Failed to update uva.');
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param \App\Models\Uva $uva
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Uva $uva)
    {

        try {
            // Delete the UVA record from the database
            $uva->delete();

            // Redirect to the UVA index page with a success message
            return Redirect::route('uva.index')->with('success', 'Uva deleted successfully.');
        }
        catch (Exception $e) {
            // Log the error and redirect back with an error message
            Log::error('Failed to delete uva: ' . $e->getMessage(), ['exception' => $e]);
            return Redirect::back()->with('error', 'Failed to delete uva.');
        }
    }

    /**
     * Display a listing of all resources without related vinos.
     *
     * @return \Inertia\Response
     */
    public function all()
    {
        // Retrieve all UVAs without related vinos
        $uvas = Uva::all();

        // Return the UVAs as a JSON response
        return response()->json(UvaResource::collection($uvas));
    }
}