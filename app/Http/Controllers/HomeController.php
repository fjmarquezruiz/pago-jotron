<?php

namespace App\Http\Controllers;

use App\Http\Resources\VinoResource;
use App\Models\Vino;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        // Logic to fetch "related" or featured wines.
        // Previously hardcoded as related to ID 1.
        // Now fetching a curated list or random selection.

        // For now, let's replicate the logic but server-side: 
        // Get 10 random wines with relationships.
        $featuredWines = Vino::with(['denominacion', 'categoria', 'bodega'])
            ->inRandomOrder()
            ->take(10)
            ->get();

        return Inertia::render('Public/Home/Index', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'laravelVersion' => Application::VERSION,
            'phpVersion' => PHP_VERSION,
            'featuredWines' => VinoResource::collection($featuredWines),
        ]);
    }
}