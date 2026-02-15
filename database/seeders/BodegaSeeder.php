<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BodegaSeeder extends Seeder
{
    public function run(): void
    {
        $bodegas = [
            ['name' => 'Marqués de Riscal', 'city' => 'Elciego', 'province' => 'Álava'],
            ['name' => 'Vega Sicilia', 'city' => 'Valbuena de Duero', 'province' => 'Valladolid'],
            ['name' => 'Muga', 'city' => 'Haro', 'province' => 'La Rioja'],
            ['name' => 'Ramón Bilbao', 'city' => 'Haro', 'province' => 'La Rioja'],
            ['name' => 'Protos', 'city' => 'Peñafiel', 'province' => 'Valladolid'],
            ['name' => 'Matarromera', 'city' => 'Valbuena de Duero', 'province' => 'Valladolid'],
            ['name' => 'Terras Gauda', 'city' => 'O Rosal', 'province' => 'Pontevedra'],
            ['name' => 'Martín Códax', 'city' => 'Cambados', 'province' => 'Pontevedra'],
            ['name' => 'Pago de los Capellanes', 'city' => 'Pedrosa de Duero', 'province' => 'Burgos'],
            ['name' => 'Emilio Moro', 'city' => 'Pesquera de Duero', 'province' => 'Valladolid'],
            ['name' => 'Codorníu', 'city' => 'Sant Sadurní d\'Anoia', 'province' => 'Barcelona'],
            ['name' => 'Freixenet', 'city' => 'Sant Sadurní d\'Anoia', 'province' => 'Barcelona'],
            ['name' => 'Juan Gil', 'city' => 'Jumilla', 'province' => 'Murcia'],
            ['name' => 'Álvaro Palacios', 'city' => 'Gratallops', 'province' => 'Tarragona'],
            ['name' => 'Descendientes de J. Palacios', 'city' => 'Villafranca del Bierzo', 'province' => 'León']
        ];

        foreach ($bodegas as $bodegaData) {
            $bodegaId = DB::table('bodegas')->insertGetId([
                'name' => $bodegaData['name'],
                'city' => $bodegaData['city'],
                'province' => $bodegaData['province'],
                'blocked' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Link to a logical D.O. based on province/name
            $doName = match ($bodegaData['province']) {
                    'Álava', 'La Rioja' => 'D.O. Ca. Rioja',
                    'Valladolid' => (str_contains($bodegaData['name'], 'Ribera') || $bodegaData['name'] === 'Vega Sicilia' || $bodegaData['name'] === 'Protos' || $bodegaData['name'] === 'Matarromera' || $bodegaData['name'] === 'Emilio Moro') ? 'D.O. Ribera del Duero' : 'D.O. Rueda',
                    'Pontevedra' => 'D.O. Rías Baixas',
                    'Barcelona' => (str_contains($bodegaData['name'], 'Codorníu') || $bodegaData['name'] === 'Freixenet') ? 'D.O. Cava' : 'D.O. Penedés',
                    'Murcia' => 'D.O. Jumilla',
                    'Tarragona' => 'D.O. Priorat',
                    'León' => 'D.O. Bierzo',
                    'Burgos' => 'D.O. Ribera del Duero',
                    default => 'Vino de la Tierra de Castilla',
                };

            $doId = DB::table('denominaciones')->where('name', $doName)->value('id');
            if ($doId) {
                DB::table('bodega_denominaciones')->insert([
                    'bodega_id' => $bodegaId,
                    'denominacion_id' => $doId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}