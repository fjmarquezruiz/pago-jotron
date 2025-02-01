<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVinoRequest;
use App\Http\Resources\VinoResource;
use App\Models\Vino;
use App\Models\Vinouva;
use App\Services\CloudinaryService;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Exception;

class VinoController extends Controller
{
    protected $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }

    public function index()
    {
        $paginationLimit = config('settings.pagination_limit', 15); // Configurable pagination limit
        $paginated = Vino::with('uvas')->latest()->paginate($paginationLimit); // Eager load relationships

        return Inertia::render('Dashboard/Vino/Index', [
            'vinos' => VinoResource::collection($paginated)
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Vino/Create');
    }

    public function store(StoreVinoRequest $request)
    {
        $validatedData = $request->validated();
        $uvaData = $request->input('uvas', []);

        try {
            $this->handleImageUpload($request, $validatedData);

            if (isset($validatedData["image"])) {
                unset($validatedData['image']);
            }

            if (isset($validatedData["uvas"])) {
                unset($validatedData['uvas']);
            }

            $vino = Vino::create($validatedData);

            $this->handleVinoUvas($vino, $uvaData);

            return Redirect::route('vino.index')->with('success', 'Vino created successfully.');
        } catch (Exception $e) {
            Log::error('Failed to create vino: ' . $e->getMessage(), ['exception' => $e]);
            return Redirect::back()->with('error', 'Failed to create vino. ' . $e->getMessage());
        }
    }

    public function show(Vino $vino)
    {
        return Inertia::render('Dashboard/Vino/Show', [
            'vino' => new VinoResource($vino)
        ]);
    }

    public function edit(Vino $vino)
    {
        return Inertia::render('Dashboard/Vino/Edit', [
            'vino' => new VinoResource($vino)
        ]);
    }

    public function update(StoreVinoRequest $request, Vino $vino)
    {
        $validatedData = $request->validated();
        $uvaData = $request->input('uvas', []);

        try {
            $this->handleImageUpload($request, $validatedData, $vino);

            $this->handleVinoUvas($vino, $uvaData);

            unset($validatedData['image'], $validatedData['uvas']); // Remove unnecessary fields
            $vino->update($validatedData);

            return Redirect::route('vino.index')->with('success', 'Vino updated successfully.');
        } catch (Exception $e) {
            Log::error('Failed to update vino: ' . $e->getMessage(), ['exception' => $e]);
            return Redirect::back()->with('error', 'Failed to update vino.');
        }
    }

    public function destroy(Vino $vino)
    {
        try {
            if ($vino->public_id) {
                $this->cloudinaryService->deleteImage($vino->public_id);
            }
            $vino->delete();

            return Redirect::route('vino.index')->with('success', 'Vino deleted successfully.');
        } catch (Exception $e) {
            Log::error('Failed to delete vino: ' . $e->getMessage(), ['exception' => $e]);
            return Redirect::back()->with('error', 'Failed to delete vino.');
        }
    }

    public function updateBlocked(StoreVinoRequest $request, Vino $vino)
    {
        $validatedData = $request->validate([
            'blocked' => ['nullable', 'boolean'], // Blocked status can be null, but if provided, it must be a boolean value.
        ]);

        try {
            $vino->update(['blocked' => $validatedData['blocked']]);

            return Redirect::route('vino.index')->with('success', 'Vino blocked status updated successfully.');
        } catch (Exception $e) {
            Log::error('Failed to update vino blocked status: ' . $e->getMessage(), ['exception' => $e]);
            return Redirect::back()->with('error', 'Failed to update vino blocked status.');
        }
    }

    /**
     * Handle image upload and deletion.
     *
     * @param \Illuminate\Http\Request $request
     * @param array $validatedData
     * @param \App\Models\Vino|null $vino
     */
    private function handleImageUpload($request, &$validatedData, $vino = null)
    {
        if ($request->hasFile('image')) {
            if ($vino && $vino->public_id) {
                $this->cloudinaryService->deleteImage($vino->public_id);
            }
            $imageData = $this->cloudinaryService->uploadImage($request->file('image')->getRealPath());
            $validatedData['image_url'] = $imageData['url'];
            $validatedData['public_id'] = $imageData['public_id'];
        } elseif ($request->has('image_url') && $request->input('image_url') === '') {
            if ($vino && $vino->public_id) {
                $this->cloudinaryService->deleteImage($vino->public_id);
            }
            $validatedData['image_url'] = null;
            $validatedData['public_id'] = null;
        }
    }

    private function handleVinoUvas(Vino $vino, array $uvaData)
    {
        // Start a transaction
        DB::beginTransaction();
        try {
            $vino->vinoUvas()->delete(); // Clear existing relationships

            foreach ($uvaData as $uva) {
                if (!isset($uva['id']) || !isset($uva['pivot']['percent']) || !is_numeric($uva['pivot']['percent'])) {
                    throw new \Exception('Invalid data for uva ID ' . ($uva['id'] ?? 'unknown'));
                }

                VinoUva::create([
                    'vino_id' => $vino->id,
                    'uva_id' => $uva['id'],
                    'percent' => $uva['pivot']['percent'], // Accessing the percent from the pivot
                ]);
            }

            // Ensure the total percentage is 100
            // if ($vino->vinoUvas()->sum('percent') !== 100) {
            //     throw new \Exception('The total percentage of uva varieties must be 100.');
            // }

            // Commit the transaction
            DB::commit();
        } catch (\Exception $e) {
            // Rollback the transaction if something went wrong
            DB::rollBack();
            Log::error('Failed to create save vino_uvas: ' . $e->getMessage(), ['exception' => $e]);
            throw $e; // Re-throw the exception for further handling
        }
    }
}
