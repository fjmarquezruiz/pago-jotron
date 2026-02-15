# Improvements and Fixes Plan

-   [ ] **Security Fix**: Secure Address Management <!-- id: 0 -->
    -   [ ] Create `DireccionPolicy`.
    -   [ ] Authorize `view`, `update`, `delete` actions in `DireccionController`.
    -   [ ] Remove or secure `getAllDirectionsForUser` endpoint.
-   [ ] **Refactor**: Frontend Data Fetching <!-- id: 1 -->
    -   [ ] Create `HomeController` (or update `web.php` route closure).
    -   [ ] Move "Related Wines" logic from `VinoController` API to `HomeController`.
    -   [ ] Pass data as props to `Index.tsx`.
    -   [ ] Remove `useEffect` and `fetch` from `Index.tsx`.
-   [ ] **Code Quality**: Standardize Validation <!-- id: 2 -->
    -   [ ] Extract validation rules from `DireccionController` to `StoreDireccionRequest` and `UpdateDireccionRequest`.
-   [ ] **Performance**: Optimize Related Products <!-- id: 3 -->
    -   [ ] Replace `inRandomOrder()` with a more efficient random selection strategy for large datasets (or cache the result).

---

## 1. 🚨 Critical Security Fixes

### Secure `DireccionController` (IDOR)
**Problem:** Methods like `getAllDirectionsForUser($id)` allow accessing any user's data.
**Solution:**
1.  **Generate Policy:** `php artisan make:policy DireccionPolicy --model=Direccion`
2.  **Define Rules:**
    ```php
    public function view(User $user, Direccion $direccion) {
        return $user->id === $direccion->user_id;
    }
    ```
3.  **Apply in Controller:**
    ```php
    public function show(Direccion $direccion) {
        $this->authorize('view', $direccion);
        return new DireccionResource($direccion);
    }
    ```
4.  **Refactor Custom Endpoints:** Change `getAllDirectionsForUser($userId)` to use `Auth::user()->direcciones` and remove the `$userId` parameter entirely.

## 2. 🏗️ Architecture & Frontend Refactor

### Fix Home Page Data Fetching
**Problem:** `Index.tsx` fetches data client-side using a hardcoded ID.
**Solution:**
1.  **Update Route:**
    ```php
    // routes/web.php
    Route::get('/', [HomeController::class, 'index'])->name('home');
    ```
2.  **Create Controller:**
    ```php
    class HomeController extends Controller {
        public function index() {
            $featuredWines = Vino::with('bodega')->take(6)->get(); // Example logic
            return Inertia::render('Public/Home/Index', [
                'featuredWines' => VinoResource::collection($featuredWines),
            ]);
        }
    }
    ```
3.  **Update React Component:**
    ```tsx
    const Index = ({ auth, featuredWines }) => {
        // Use featuredWines prop directly. No useEffect.
    }
    ```

## 3. 🧹 Code Quality & Cleanup

### Standardize Requests
-   Refactor `DireccionController::store` and `update` to use `StoreDireccionRequest` and `UpdateDireccionRequest`.
-   This removes clutter from the controller and ensures validation logic is reusable.

### Fix "Magic" Numbers
-   Remove the hardcoded `fetch("/api/vinos/related/1")` in `Index.tsx`.
-   If "Related Wines" are needed on the homepage, define what they are related *to* (e.g., "Wines of the Month" or "Staff Picks") rather than related to "ID 1".

## 4. ⚡ Performance Improvements

### Optimize "Random" Query
**Problem:** `inRandomOrder()` sorts the entire table before picking rows. Slow on large tables.
**Solution:**
-   **Quick Fix:** For small datasets (<10k rows), `inRandomOrder` is acceptable.
-   **Better Approach:** Select random IDs first, then fetch:
    ```php
    $randomIds = Vino::inRandomOrder()->limit(10)->pluck('id');
    $vinos = Vino::whereIn('id', $randomIds)->with(...)->get();
    ```
-   **Best Approach:** Cache the "Featured/Related" list for 1 hour.
