<?php

namespace App\Http\Controllers;

use App\Models\Vino;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Resources\VinoResource;

class ShopController extends Controller
{
    /**
     * Display a listing of the resource.
     */

    public function index(Request $request)
    {
        $paginationLimit = config('settings.pagination_limit', 9); // Configurable pagination limit

        // Validate the incoming request
        $validated = $request->validate([
            'priceRange' => 'nullable|array|min:2|max:2',
            'priceRange.*' => 'numeric',
            'wineTypes' => 'nullable|array',
            'denominations' => 'nullable|array',
            'grapeTypes' => 'nullable|array',
            'winery' => 'nullable|integer',
            'sortField' => 'nullable|in:name,price,created_at',
            'sortDirection' => 'nullable|in:asc,desc',
        ]);

        // Extract validated data
        $priceRange = $validated['priceRange'] ?? [];
        $wineTypes = $validated['wineTypes'] ?? [];
        $denominations = $validated['denominations'] ?? [];
        $grapeTypes = $validated['grapeTypes'] ?? [];
        $winery = $validated['winery'] ?? null;
        $sortField = $validated['sortField'] ?? 'name';
        $sortDirection = $validated['sortDirection'] ?? 'asc';

        // Get filters from request
        // $priceRange =
        //     $request->input('priceRange', []);
        // $wineTypes = $request->input('wineTypes', []);
        // $denominations = $request->input('denominations', []);
        // $grapeTypes = $request->input('grapeTypes', []);
        // $winery = $request->input('winery');
        // $sortField = $request->input('sortField', 'name');
        // $sortDirection = $request->input('sortDirection', 'asc');



        // Query builder
        $query = Vino::with('uvas'); // Keep relationship

        // Apply price range filter
        if (!empty($priceRange)) {
            $query->whereBetween('price', $priceRange);
        }

        // Apply wine types filter
        if (!empty($wineTypes)) {
            $query->whereHas('categoria', function ($q) use ($wineTypes) {
                $q->whereIn('id', $wineTypes);
            });
        }

        // Apply denominations filter
        if (!empty($denominations)) {
            $query->whereHas('denominacion', function ($q) use ($denominations) {
                $q->whereIn('id', $denominations);
            });
        }

        // Apply grape types filter
        if (!empty($grapeTypes)) {
            $query->whereHas('uvas', function ($q) use ($grapeTypes) {
                $q->whereIn('id', $grapeTypes);
            });
        }

        // Apply winery filter
        if (!empty($winery)) {
            $query->whereHas('bodega', function ($q) use ($winery) {
                $q->where('id', $winery);
            });
        }

        // Apply sorting
        if (in_array($sortField, ['price', 'name', 'created_at'])) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->latest(); // Default sorting
        }

        // Paginate results
        $paginated = $query->paginate($paginationLimit);

        return inertia('Public/Shop/Index', [
            'vinos' => VinoResource::collection($paginated),
            'queryParams' => $request->all(),
        ]);
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
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Vino $vino)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Vino $vino)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Vino $vino)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Vino $vino)
    {
        //
    }
}
