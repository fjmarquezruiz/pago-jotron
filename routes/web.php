<?php

use App\Enum\PermissionsEnum;
use App\Enum\RolesEnum;
use App\Http\Controllers\BodegaController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\DenominacionController;
use App\Http\Controllers\FeatureController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VinoController;
use App\Http\Controllers\UvaController;
use App\Http\Controllers\VinouvaController;
use Illuminate\Contracts\Console\Application;
use Illuminate\Foundation\Application as FoundationApplication;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Public/Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => FoundationApplication::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('/');
// Route::redirect('/', '/dashboard');

Route::get('/shop', function () {
    return Inertia::render('Public/Shop/Index');
})->name('shop');

Route::get('/cart', function () {
    return Inertia::render('Public/Cart/Index');
})->name('cart');


// Route::get('/dashboard', function () {
//     return Inertia::render('Dashboard');
// })->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    // Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Route::middleware(['verified', 'role:' . RolesEnum::Admin->value])->group(function () {
    Route::middleware(['verified'])->group(function () {
        // Route::get('/user', [UserController::class, 'index'])->name('user.index');
        // Route::get('/user/{user}/edit', [UserController::class, 'edit'])->name('user.edit');
        // Route::put('/user/{user}', [UserController::class, 'update'])->name('user.update');
        // Route::get('/user/{user}', [UserController::class, 'show'])->name('user.show');
        // Route::delete('/user/{user}', [UserController::class, 'destroy'])->name('user.destroy');

        Route::resource('user', UserController::class);
    });

    // Verified routes
    Route::middleware(['verified'])->group(function () {
        // Dashboard route
        Route::get('/dashboard', function () {
            return Inertia::render('Dashboard/Index');
        })->name('dashboard');

        // Route::get('/vino', [VinoController::class, 'index'])->name('vino.index');
        Route::resource('vino', VinoController::class)->middleware('can:' . PermissionsEnum::ManageVinos->value);
        Route::post('/vino/{vino}/update', [VinoController::class, 'update'])->name('vino.update');
        Route::post('/vino/{vino}/update-blocked', [VinoController::class, 'updateBlocked'])->name('vino.update-blocked');

        Route::resource('bodega', BodegaController::class);

        Route::resource('denominacion', DenominacionController::class);

        Route::resource('uva', UvaController::class);

        // Resource routes with permissions
        // Route::get('/feature', [FeatureController::class, 'index'])->name('feature.index');
        Route::resource('feature', FeatureController::class)->middleware('can:' . PermissionsEnum::ManageFeatures->value);

        Route::prefix('vinos/{vino}')->group(function () {
            Route::get('/uvas', [VinoUvaController::class, 'index'])->name('vino.uvas.index');
            Route::post('/uvas', [VinoUvaController::class, 'store'])->name('vino.uvas.store');
            Route::put('/uvas/{vinoUva}', [VinoUvaController::class, 'update'])->name('vino.uvas.update');
            Route::delete('/uvas/{vinoUva}', [VinoUvaController::class, 'destroy'])->name('vino.uvas.destroy');
        });
    });
});

// API routes
Route::prefix('api')->group(function () {
    Route::get('/bodegas', [BodegaController::class, 'all']);
    Route::get('/denominaciones', [DenominacionController::class, 'all']);
    Route::get('/categorias', [CategoriaController::class, 'all']);
    Route::get('/uvas', [UvaController::class, 'all']);
});

require __DIR__ . '/auth.php';
