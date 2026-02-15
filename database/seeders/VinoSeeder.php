<?php

namespace Database\Seeders;

use App\Models\Bodega;
use App\Models\Categoria;
use App\Models\Denominacion;
use App\Models\Uva;
use App\Models\Vino;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class VinoSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('es_ES');

        // Get generic IDs to link
        $bodegas = Bodega::pluck('id')->toArray();
        $denominaciones = Denominacion::pluck('id')->toArray();
        $categorias = Categoria::pluck('id')->toArray();
        $uvas = Uva::pluck('id')->toArray();

        // prefixes for realistic wine names
        $prefixes = ['Marqués de ', 'Castillo de ', 'Viña ', 'Hacienda ', 'Pago de ', 'Finca ', 'Coto de ', 'Barón de ', 'Duque de ', 'Reserva ', 'Gran Reserva ', 'Selección '];
        $suffixes = [' Real', ' Mayor', ' Viejo', ' Nuevo', ' del Sur', ' del Norte', ' de Oro', ' de Plata', ' Especial', ' Único'];

        if (empty($bodegas) || empty($denominaciones) || empty($categorias)) {
            $this->command->error('Run Bodega, Denominacion and Categoria seeders first!');
            return;
        }

        // Real Unsplash images for wines
        $wineImages = [
            'https://images.unsplash.com/photo-1553361371-9bb220269711?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1510850402719-e4c78a4c1ea5?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1547595628-c61a29f496f0?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1559113513-d5e09c316200?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1562608107-590d557324bb?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1566733971217-d18efcb493f0?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?auto=format&fit=crop&w=600&q=80',
        ];

        for ($i = 0; $i < 60; $i++) {
            $name = $faker->randomElement($prefixes) . $faker->firstName . $faker->randomElement($suffixes); // e.g., "Marqués de Juan Viejo"

            $vino = Vino::create([
                'name' => $name,
                'price' => $faker->randomFloat(2, 5, 200), // Price between 5 and 200
                'stock' => $faker->numberBetween(0, 500),
                'vintage_year' => $faker->year(),
                'image_url' => $faker->randomElement($wineImages),
                'description' => $faker->paragraph(),
                'visual' => $faker->sentence(),
                'aromas' => $faker->sentence(),
                'taste' => $faker->sentence(),
                'capacity' => 750,
                'minimum_temperature' => $faker->randomFloat(1, 12, 16),
                'maximum_temperature' => $faker->randomFloat(1, 16, 18),
                'alcohol' => $faker->randomFloat(1, 11, 15),
                'food_pairing' => $faker->sentence(),
                'blocked' => $faker->boolean(5), // 5% chance of being blocked
                'bodega_id' => $faker->randomElement($bodegas),
                'denominacion_id' => $faker->randomElement($denominaciones),
                'categoria_id' => $faker->randomElement($categorias),
                'created_at' => $faker->dateTimeBetween('-1 year', 'now'),
                'updated_at' => now(),
            ]);

            // Sync the relationship between the winery and the origin denomination
            $vino->bodega->denominaciones()->syncWithoutDetaching([$vino->denominacion_id]);

            // Attach random grapes (1 to 3 varieties)
            $numGrapes = $faker->numberBetween(1, 3);
            $randomUvas = $faker->randomElements($uvas, $numGrapes);

            $weights = [];
            for ($j = 0; $j < $numGrapes; $j++) {
                $weights[] = mt_rand(1, 100);
            }
            $totalWeight = array_sum($weights);

            $currentSum = 0;
            foreach ($randomUvas as $index => $uvaId) {
                if ($index === $numGrapes - 1) {
                    // Last grape gets the remainder to ensure exactly 100%
                    $percent = 100 - $currentSum;
                }
                else {
                    $percent = round(($weights[$index] / $totalWeight) * 100, 2);
                    $currentSum += $percent;
                }
                $vino->uvas()->attach($uvaId, ['percent' => $percent]);
            }
        }
    }
}