<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class CheckoutController extends Controller
{
    public function process(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'postal_code' => 'required|string|max:20',
            'phone' => 'required|string|max:20',
        ]);

        try {
            DB::beginTransaction();

            // Create the order
            $order = Order::create([
                'user_id' => auth()->id(),
                'status' => 'pending',
                'total' => 0, // Will be updated with actual total
                'shipping_name' => $validated['name'],
                'shipping_address' => $validated['address'],
                'shipping_city' => $validated['city'],
                'shipping_postal_code' => $validated['postal_code'],
                'shipping_phone' => $validated['phone'],
                'email' => $validated['email'],
            ]);

            $total = 0;

            // Create order items from cart
            foreach ($request->input('items', []) as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'vino_id' => $item['id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'subtotal' => $item['price'] * $item['quantity'],
                ]);

                $total += $item['price'] * $item['quantity'];
            }

            // Update order total
            $order->update(['total' => $total]);

            DB::commit();

            return redirect()->route('checkout.success')
                ->with('success', 'Order placed successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'There was a problem processing your order.');
        }
    }
} 