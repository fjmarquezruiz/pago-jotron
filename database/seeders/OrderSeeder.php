<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Vino;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('es_ES');

        $users = User::pluck('id')->toArray();
        $vinos = Vino::all();

        if (empty($users) || $vinos->isEmpty()) {
            $this->command->error('Users and Vinos are required to seed orders.');
            return;
        }

        // Create 20 random orders
        for ($i = 0; $i < 20; $i++) {
            $status = $faker->randomElement(['pending', 'processing', 'completed', 'cancelled']);

            $order = Order::create([
                'user_id' => $faker->randomElement($users),
                'status' => $status,
                'total' => 0, // Will calculate later
                'shipping_name' => $faker->name,
                'shipping_address' => $faker->address,
                'shipping_city' => $faker->city,
                'shipping_postal_code' => $faker->postcode,
                'shipping_phone' => $faker->phoneNumber,
                'email' => $faker->email,
                'created_at' => $faker->dateTimeBetween('-6 months', 'now'),
                'updated_at' => now(),
            ]);

            // Add 1 to 5 items per order
            $total = 0;
            $itemsCount = $faker->numberBetween(1, 5);

            for ($j = 0; $j < $itemsCount; $j++) {
                $vino = $vinos->random();
                $quantity = $faker->numberBetween(1, 3);
                $price = $vino->price;
                $subtotal = $price * $quantity;

                OrderItem::create([
                    'order_id' => $order->id,
                    'vino_id' => $vino->id,
                    'quantity' => $quantity,
                    'price' => $price,
                    'subtotal' => $subtotal,
                ]);

                $total += $subtotal;
            }

            // Update order total
            $order->update(['total' => $total]);
        }
    }
}