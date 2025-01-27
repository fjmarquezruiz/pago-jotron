<?php

namespace App\Http\Controllers;

use App\Http\Resources\FeatureResource;
use App\Models\Feature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class FeatureController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $paginated = Feature::latest()->paginate();

        return Inertia::render('Feature/Index', [
            'features' => FeatureResource::collection($paginated)
        ]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        return Inertia::render('Feature/Create');
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        // $data = $request->validate([
        //     'name' => ['required', 'string'],
        //     'description' => ['nullable', 'string'],
        // ]);

        // $data['user_id'] = auth()->id();

        // Feature::create($data);

        // return to_route('feature.index')->with('success', 'Feature created successfully.');
        $validatedData = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ], [
            'name.required' => 'The name field is required.',
            'name.string' => 'The name must be a string.',
            'name.max' => 'The name may not be greater than 255 characters.',
            'description.string' => 'The description must be a string.',
            'description.max' => 'The description may not be greater than 1000 characters.',
        ]);

        $validatedData['user_id'] = Auth::id();

        try {
            Feature::create($validatedData);
            return Redirect::route('feature.index')->with('success', 'Feature created successfully.');
        } catch (\Exception $e) {
            return Redirect::back()->with('error', 'Failed to create feature: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Feature  $feature
     * @return \Inertia\Response
     */
    public function show(Feature $feature)
    {
        return Inertia::render('Feature/Show', [
            'feature' => new FeatureResource($feature)
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\Feature  $feature
     * @return \Inertia\Response
     */
    public function edit(Feature $feature)
    {
        return Inertia::render('Feature/Edit', [
            'feature' => new FeatureResource($feature)
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Feature  $feature
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Feature $feature)
    {
        // $data = $request->validate([
        //     'name' => ['required', 'string'],
        //     'description' => ['nullable', 'string'],
        // ]);

        // $feature->update($data);

        // return to_route('feature.index')->with('success', 'Feature updated successfully.');
        $validatedData = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ], [
            'name.required' => 'The name field is required.',
            'name.string' => 'The name must be a string.',
            'name.max' => 'The name may not be greater than 255 characters.',
            'description.string' => 'The description must be a string.',
            'description.max' => 'The description may not be greater than 1000 characters.',
        ]);

        try {
            $feature->update($validatedData);
            return Redirect::route('feature.index')->with('success', 'Feature updated successfully.');
        } catch (\Exception $e) {
            return Redirect::back()->with('error', 'Failed to update feature: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Feature  $feature
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Feature $feature)
    {
        // $feature->delete();

        // return to_route('feature.index')->with('success', 'Feature deleted successfully.');
        try {
            $feature->delete();
            return Redirect::route('feature.index')->with('success', 'Feature deleted successfully.');
        } catch (\Exception $e) {
            return Redirect::back()->with('error', 'Failed to delete feature: ' . $e->getMessage());
        }
    }
}
