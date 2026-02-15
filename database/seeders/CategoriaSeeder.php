<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategoriaSeeder extends Seeder
{
    public function run(): void
    {
        $categorias = [
            'Tinto',
            'Blanco',
            'Rosado',
            'Espumoso',
            'Generoso',
            'Dulce',
            'Vermut'
        ];

        foreach ($categorias as $categoria) {
            DB::table('categorias')->insertOrIgnore([
                'name' => $categoria,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}