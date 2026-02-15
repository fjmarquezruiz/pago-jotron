<?php

use App\Enum\PermissionsEnum;
use App\Enum\RolesEnum;
use App\Http\Controllers\BodegaController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\DenominacionController;
use App\Http\Controllers\FeatureController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VinoController;
use App\Http\Controllers\UvaController;
use App\Http\Controllers\VinouvaController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\DireccionController;
use Illuminate\Contracts\Console\Application;
use Illuminate\Foundation\Application as FoundationApplication;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\HomeController;

Route::middleware(['age.verified'])->group(function () {
    Route::get('/', [HomeController::class , 'index'])->name('/');
});

Route::get('/age-verification', function () {
    return Inertia::render('Public/AgeVerification/Index');
})->name('age.verification');

Route::post('/age-verification', function (\Illuminate\Http\Request $request) {
    $request->session()->put('ageVerified', true);
    return redirect()->route('/');
})->name('age.verification.process');


Route::get('/shop', [ShopController::class , 'index'])->name('shop');

Route::get('/cart', function () {
    return Inertia::render('Public/Cart/Index');
})->name('cart');

Route::get('/detail/{vino}', [VinoController::class , 'showPublic'])->name('shop.detail');


Route::middleware('auth')->group(function () {
    // Profile routes
    Route::get('/profile', [ProfileController::class , 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class , 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class , 'destroy'])->name('profile.destroy');

    // Route::middleware(['verified', 'role:' . RolesEnum::Admin->value])->group(function () {
    Route::middleware(['verified'])->group(function () {
            // Route::get('/user', [UserController::class, 'index'])->name('user.index');
            // Route::get('/user/{user}/edit', [UserController::class, 'edit'])->name('user.edit');
            // Route::put('/user/{user}', [UserController::class, 'update'])->name('user.update');
            // Route::get('/user/{user}', [UserController::class, 'show'])->name('user.show');
            // Route::delete('/user/{user}', [UserController::class, 'destroy'])->name('user.destroy');
    
            Route::resource('user', UserController::class);
        }
        );

        // Verified routes
        Route::middleware(['verified'])->group(function () {
            // Dashboard route
            Route::get('/dashboard', function () {
                    return Inertia::render('Dashboard/Index');
                }
                )->name('dashboard');

                // Route::get('/vino', [VinoController::class, 'index'])->name('vino.index');
                Route::resource('vino', VinoController::class)->middleware('can:' . PermissionsEnum::ManageVinos->value);
                Route::post('/vino/{vino}/update', [VinoController::class , 'update'])->name('vino.update');
                Route::post('/vino/{vino}/update-blocked', [VinoController::class , 'updateBlocked'])->name('vino.update-blocked');

                Route::resource('bodega', BodegaController::class);

                Route::resource('denominacion', DenominacionController::class);

                Route::resource('uva', UvaController::class);

                // Resource routes with permissions
                // Route::get('/feature', [FeatureController::class, 'index'])->name('feature.index');
                Route::resource('feature', FeatureController::class)->middleware('can:' . PermissionsEnum::ManageFeatures->value);

                Route::prefix('vinos/{vino}')->group(function () {
                    Route::get('/uvas', [VinoUvaController::class , 'index'])->name('vino.uvas.index');
                    Route::post('/uvas', [VinoUvaController::class , 'store'])->name('vino.uvas.store');
                    Route::put('/uvas/{vinoUva}', [VinoUvaController::class , 'update'])->name('vino.uvas.update');
                    Route::delete('/uvas/{vinoUva}', [VinoUvaController::class , 'destroy'])->name('vino.uvas.destroy');
                }
                );

                Route::resource('direccion', DireccionController::class);
                Route::get('/user/direcciones', [DireccionController::class , 'getAllDirectionsForUser'])->name('user.direcciones');
                Route::get('/user/shipping-direction', [DireccionController::class , 'getMainShippingDirectionForUser'])->name('user.shipping-direction');
            }
            );

            Route::get('/checkout', function () {
            return Inertia::render('Public/Checkout/Index');
        }
        )->name('checkout.index');

        Route::post('/checkout/process', [CheckoutController::class , 'process'])
            ->name('checkout.process');

        Route::get('/checkout/success', function () {
            return Inertia::render('Public/Checkout/Success');
        }
        )->name('checkout.success');

    // Route::get('/detail/{id}', function () {
    //     return Inertia::render('Public/Shop/Detail');
    // })->name('shop.detail');
    

    });



// API routes
Route::prefix('api')->group(function () {
    Route::get('/bodegas', [BodegaController::class , 'all']);
    Route::get('/denominaciones', [DenominacionController::class , 'all']);
    Route::get('/categorias', [CategoriaController::class , 'all']);
    Route::get('/uvas', [UvaController::class , 'all']);
    Route::get('/vinos/related/{vino}', [VinoController::class , 'relatedWines']);
});

require __DIR__ . '/auth.php';