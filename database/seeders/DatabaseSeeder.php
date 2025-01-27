<?php

namespace Database\Seeders;

use App\Enum\PermissionsEnum;
use App\Enum\RolesEnum;
use App\Models\Feature;
use App\Models\User;
use Carbon\Carbon;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create roles
        $adminRole = Role::create(['name' => RolesEnum::Admin->value]);
        $commenterRole = Role::create(['name' => RolesEnum::Commenter->value]);
        $editorRole = Role::create(['name' => RolesEnum::Editor->value]);
        $userRole = Role::create(['name' => RolesEnum::User->value]);

        // Create permissions
        $manageFeaturesPermission = Permission::create(['name' => PermissionsEnum::ManageFeatures->value]);
        $manageCommentsPermission = Permission::create(['name' => PermissionsEnum::ManageComments->value]);
        $manageUsersPermission = Permission::create(['name' => PermissionsEnum::ManageUsers->value]);
        $manageRolesPermission = Permission::create(['name' => PermissionsEnum::ManageRoles->value]);
        $upvoteDownvotePermission = Permission::create(['name' => PermissionsEnum::UpvoteDownvote->value]);
        $manageBodegasPermission = Permission::create(['name' => PermissionsEnum::ManageBodegas->value]);
        $manageVinosPermission = Permission::create(['name' => PermissionsEnum::ManageVinos->value]);
        $manageDenominacionesPermission = Permission::create(['name' => PermissionsEnum::ManageDenominaciones->value]);

        // Assign permissions to roles
        $adminRole->syncPermissions([
            $upvoteDownvotePermission,
            $manageCommentsPermission,
            $manageFeaturesPermission,
            $manageRolesPermission,
            $manageUsersPermission,
            $manageBodegasPermission,
            $manageVinosPermission,
            $manageDenominacionesPermission
        ]);

        $commenterRole->syncPermissions([
            $upvoteDownvotePermission,
            $manageCommentsPermission
        ]);

        $editorRole->syncPermissions([
            $manageBodegasPermission,
            $manageVinosPermission
        ]);

        $userRole->syncPermissions([
            $upvoteDownvotePermission
        ]);

        // Create users and assign roles
        $eighteenYearsAgo = Carbon::now()->subYears(18);

        User::factory()->create([
            'name' => 'Admin User',
            'last_name' => 'Admin User',
            'date_of_birth' => $eighteenYearsAgo,
            'email' => 'admin@example.com',
            'password' => '$2y$12$itWKfFj16snyc5fa5xwtsucW4ySUDNLdDMjD2zSb.uNSMhLzBs3p2',
        ])->assignRole(RolesEnum::Admin);

        User::factory()->create([
            'name' => 'Commenter User',
            'last_name' => 'Commenter User',
            'date_of_birth' => $eighteenYearsAgo,
            'email' => 'commenter@example.com',
            'password' => '$2y$12$vUkYMStTo.iA4v1XQfv3WufhPN4F77.BpOwqNP//prFbg7onZdV4G',
        ])->assignRole(RolesEnum::Commenter);

        User::factory()->create([
            'name' => 'Editor User',
            'last_name' => 'Editor User',
            'date_of_birth' => $eighteenYearsAgo,
            'email' => 'editor@example.com',
            'password' => '$2y$12$ELp/OVqyHfbwpbZYxdFbjObaxc3vUIcMlxrEu/igiK34TJjXVWqWS',
        ])->assignRole(RolesEnum::Editor);

        User::factory()->create([
            'name' => 'User User',
            'last_name' => 'User User',
            'date_of_birth' => $eighteenYearsAgo,
            'email' => 'user@example.com',
            'password' => '$2y$12$ESTL568UFvhLmbwkUHw0YuQqpoM.TRpXrm0c9wOY4hmcfO75/wa/q',
        ])->assignRole(RolesEnum::User);

        // // Create features fake data
        Feature::factory(100)->create();
    }
}
