<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DireccionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = \Faker\Factory::create('es_ES');
        $users = \App\Models\User::all();

        foreach ($users as $user) {
            // Create a shipping address
            \App\Models\Direccion::create([
                'user_id' => $user->id,
                'phone' => $user->phone_number ?? $faker->phoneNumber(),
                'street_type' => $faker->randomElement(['Street', 'Avenue', 'Boulevard', 'Square']),
                'street_name' => $faker->streetName(),
                'street_number' => $faker->buildingNumber(),
                'postal_code' => $faker->postcode(),
                'city' => $faker->city(),
                'state' => $faker->state(),
                'country' => 'España',
                'address_type' => 'Shipping',
                'is_billing' => false,
            ]);

            // Create a billing address
            \App\Models\Direccion::create([
                'user_id' => $user->id,
                'phone' => $user->phone_number ?? $faker->phoneNumber(),
                'street_type' => $faker->randomElement(['Street', 'Avenue', 'Boulevard', 'Square']),
                'street_name' => $faker->streetName(),
                'street_number' => $faker->buildingNumber(),
                'postal_code' => $faker->postcode(),
                'city' => $faker->city(),
                'state' => $faker->state(),
                'country' => 'España',
                'address_type' => 'Billing',
                'is_billing' => true,
            ]);
        }
    }
}