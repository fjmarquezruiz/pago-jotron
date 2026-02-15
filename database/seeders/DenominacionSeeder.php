<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DenominacionSeeder extends Seeder
{
    public function run(): void
    {
        $denominaciones = [
            'D.O. Ca. Rioja',
            'D.O. Ribera del Duero',
            'D.O. Rueda',
            'D.O. Rías Baixas',
            'D.O. Toro',
            'D.O. Priorat',
            'D.O. Penedés',
            'D.O. Navarra',
            'D.O. Jumilla',
            'D.O. Bierzo',
            'D.O. La Mancha',
            'D.O. Cava',
            'Vino de la Tierra de Castilla'
        ];

        foreach ($denominaciones as $denominacion) {
            DB::table('denominaciones')->insertOrIgnore([
                'name' => $denominacion,
                'blocked' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}