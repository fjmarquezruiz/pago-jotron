<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UvaSeeder extends Seeder
{
    public function run(): void
    {
        $uvas = [
            'Tempranillo',
            'Garnacha',
            'Albariño',
            'Verdejo',
            'Cabernet Sauvignon',
            'Merlot',
            'Syrah',
            'Monastrell',
            'Mencía',
            'Tinta de Toro',
            'Graciano',
            'Mazuelo',
            'Viura',
            'Malvasía',
            'Godello',
            'Palomino',
            'Pedro Ximénez',
            'Parellada',
            'Xarel·lo',
            'Macabeo'
        ];

        foreach ($uvas as $uva) {
            DB::table('uvas')->insertOrIgnore([
                'name' => $uva,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}