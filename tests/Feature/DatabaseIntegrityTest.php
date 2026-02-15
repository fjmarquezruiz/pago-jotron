<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;


namespace Tests\Feature;

use App\Models\Vino;
use App\Models\Bodega;
use App\Models\User;
use App\Models\Order;
use App\Models\Direccion;
use Tests\TestCase;

class DatabaseIntegrityTest extends TestCase
{
    /**
     * Verify that all wines have mandatory relationships and valid metadata.
     */
    public function test_all_wines_have_mandatory_relationships_and_valid_data(): void
    {
        $vinos = Vino::all();

        foreach ($vinos as $vino) {
            $this->assertNotNull($vino->bodega_id, "Vino {$vino->id} ('{$vino->name}') lacks a bodega_id");
            $this->assertNotNull($vino->denominacion_id, "Vino {$vino->id} ('{$vino->name}') lacks a denominacion_id");
            $this->assertNotNull($vino->categoria_id, "Vino {$vino->id} ('{$vino->name}') lacks a categoria_id");

            $this->assertGreaterThanOrEqual(0, $vino->price, "Vino {$vino->id} has negative price");
            $this->assertGreaterThanOrEqual(0, $vino->stock, "Vino {$vino->id} has negative stock");
        }
    }

    /**
     * Verify that every wine's grape composition sums to exactly 100%.
     */
    public function test_all_wines_grape_composition_sums_to_100(): void
    {
        $vinos = Vino::with('uvas')->get();

        foreach ($vinos as $vino) {
            $this->assertGreaterThanOrEqual(1, count($vino->uvas), "Vino {$vino->id} ('{$vino->name}') should have at least one grape variety");

            $sum = $vino->uvas->sum('pivot.percent');
            $this->assertEqualsWithDelta(100, $sum, 0.01, "Vino {$vino->id} ('{$vino->name}') composition sum is {$sum}% instead of 100%");
        }
    }

    /**
     * Verify that all wineries are linked to at least one Origin Denomination.
     */
    public function test_all_wineries_are_linked_to_denominations(): void
    {
        $bodegas = Bodega::all();

        foreach ($bodegas as $bodega) {
            $this->assertTrue($bodega->denominaciones()->exists(), "Bodega {$bodega->id} ('{$bodega->name}') is not linked to any D.O.");
        }
    }

    /**
     * Verify user mandatory identification data.
     */
    public function test_users_have_mandatory_id_info(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            $this->assertNotEmpty($user->email, "User {$user->id} lacks email");
            $this->assertNotEmpty($user->id_card, "User {$user->id} lacks ID card (DNI/NIE)");
            $this->assertNotEmpty($user->phone_number, "User {$user->id} lacks phone number");
        }
    }

    /**
     * Verify address ownership and data completeness.
     */
    public function test_addresses_integrity(): void
    {
        $direcciones = Direccion::all();

        foreach ($direcciones as $dir) {
            $this->assertNotNull($dir->user_id, "Direccion {$dir->id} is an orphan (no user_id)");
            $this->assertNotEmpty($dir->postal_code, "Direccion {$dir->id} lacks postal code");
            $this->assertNotEmpty($dir->city, "Direccion {$dir->id} lacks city");
        }
    }

    /**
     * Verify order accounting and linkages.
     */
    public function test_orders_accounting_integrity(): void
    {
        $orders = Order::with('items')->get();

        foreach ($orders as $order) {
            $this->assertNotNull($order->user_id, "Order {$order->id} lacks user_id");

            $itemSum = $order->items->sum('subtotal');
            $this->assertEqualsWithDelta($order->total, $itemSum, 0.01, "Order {$order->id} calculated total mismatch");

            foreach ($order->items as $item) {
                $expectedSubtotal = $item->quantity * $item->price;
                $this->assertEqualsWithDelta($expectedSubtotal, $item->subtotal, 0.01, "OrderItem {$item->id} in Order {$order->id} calculation mismatch");
                $this->assertNotNull($item->vino_id, "OrderItem {$item->id} lacks vino_id");
            }
        }
    }
}