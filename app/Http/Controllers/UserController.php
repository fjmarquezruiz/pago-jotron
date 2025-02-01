<?php

namespace App\Http\Controllers;

use App\Enum\RolesEnum;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\AuthUserResource;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Retrieve paginated list of UVAs with a configurable pagination limit
        $paginationLimit = config('settings.pagination_limit', 15); // Configurable pagination limit
        $paginated = User::latest()->paginate($paginationLimit);

        // Render the Inertia.js component with the paginated UVAs
        return Inertia::render('Dashboard/User/Index', [
            'users' => AuthUserResource::collection($paginated)
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Dashboard/User/Create', [
            'roles' => Role::all(),
            'roleLabels' => RolesEnum::labels()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request)
    {
        $validatedData = $request->validated();
        // Log::info('Validated data:', $validatedData);

        try {
            DB::beginTransaction();

            if (isset($validatedData["password"])) {
                $passwordHash = Hash::make($request->password);
                $validatedData["password"] = $passwordHash;
            }

            $user = User::create($validatedData);

            $user->syncRoles($validatedData['roles']);

            DB::commit();

            return Redirect::route('user.index')->with('success', 'User created successfully.');
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Failed to create user: ' . $e->getMessage(), ['exception' => $e]);
            return Redirect::back()->with('error', 'Failed to create user. ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return Inertia::render('Dashboard/User/Show', [
            'user' => new AuthUserResource($user),
            'roles' => Role::all(),
            'roleLabels' => RolesEnum::labels()
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        return Inertia::render('Dashboard/User/Edit', [
            'user' => new AuthUserResource($user),
            'roles' => Role::all(),
            'roleLabels' => RolesEnum::labels()
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        //
        $validatedData = $request->validated();

        // dd($validatedData);
        try {
            DB::beginTransaction();

            $user->syncRoles($validatedData['roles']);

            // Update the user record
            $user->update($validatedData);

            DB::commit();

            return Redirect::route('user.index')->with('success', 'User updated successfully.');
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Failed to update user: ' . $e->getMessage(), ['exception' => $e]);
            return Redirect::back()->with('error', 'Failed to update user.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        try {
            DB::beginTransaction();

            // Optionally, handle any related data before deleting the user
            // For example, if the user has associated roles, you might want to detach them
            $user->roles()->detach();

            // Delete the user
            $user->delete();

            DB::commit();

            return Redirect::route('user.index')->with('success', 'User deleted successfully.');
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete user: ' . $e->getMessage(), ['exception' => $e]);
            return Redirect::back()->with('error', 'Failed to delete user. ' . $e->getMessage());
        }
    }
}
