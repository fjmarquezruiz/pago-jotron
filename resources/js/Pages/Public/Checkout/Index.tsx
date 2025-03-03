import { Button } from "@/Components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import { PageProps } from "@/types";
import { Head, router, useForm } from "@inertiajs/react";
import { ChangeEvent, FormEventHandler } from "react";
import HeroSection from "../Layout/HeroSection";
import { Input } from "@/Components/ui/input";
import { CART_STORAGE_KEY } from "@/constants";

interface CheckoutFormData {
    name: string;
    email: string;
    address: string;
    city: string;
    postal_code: string;
    phone: string;
    items: {
        id: number;
        quantity: number;
        price: number;
    }[];
}

const Index = ({ auth }: PageProps) => {
    const { state, dispatch } = useCart();
    const { toast } = useToast();

    const { data, setData, processing, errors } = useForm<CheckoutFormData>({
        name: auth?.user?.name || "",
        email: auth?.user?.email || "",
        address: "",
        city: "",
        postal_code: "",
        phone: "",
        items: state.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price
        }))
    });

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setData(name as keyof CheckoutFormData, value);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (state.items.length === 0) {
            toast({
                title: "Cart is empty",
                description: "Please add items to your cart before checking out.",
                variant: "destructive",
            });
            return;
        }

        // Update items before submission to ensure latest cart state
        const formData = {
            ...data,
            items: state.items.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price
            }))
        };

        router.post(route('checkout.process'), formData, {
            onSuccess: () => {
                toast({
                    title: "Order placed successfully",
                    description: "Thank you for your purchase!",
                });
                // Clear the cart by removing all items
                state.items.forEach(item => {
                    dispatch({ type: 'REMOVE_ITEM', itemId: item.id });
                });
                localStorage.removeItem(CART_STORAGE_KEY);
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "There was a problem processing your order.",
                    variant: "destructive",
                });
            },
        });
    };

    const renderFormField = (
        label: string,
        name: keyof Omit<CheckoutFormData, 'items'>,
        type: string = "text"
    ) => (
        <div>
            <label
                htmlFor={name}
                className="block text-sm font-medium text-gray-700"
            >
                {label}
            </label>
            <Input
                id={name}
                name={name}
                type={type}
                value={data[name]}
                onChange={handleInputChange}
                className="mt-1"
                required
            />
            {errors[name] && (
                <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
            )}
        </div>
    );

    const renderOrderSummary = () => (
        <div className="mt-16 rounded-lg bg-gray-50 p-6 lg:col-span-5 lg:mt-0">
            <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
            <div className="mt-6 space-y-4">
                {state.items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center">
                            <span className="ml-3 text-sm">
                                {item.name} x {item.quantity}
                            </span>
                        </div>
                        <span className="text-sm font-medium">
                            {(item.price * item.quantity).toFixed(2)} €
                        </span>
                    </div>
                ))}

                <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                        <span className="text-base font-medium">Total</span>
                        <span className="text-base font-medium">
                            {state.total.toFixed(2)} €
                        </span>
                    </div>
                </div>
            </div>

            <Button
                className="mt-6 w-full"
                size="lg"
                type="submit"
                form="checkout-form"
                disabled={processing || state.items.length === 0}
            >
                {processing ? "Processing..." : "Complete Order"}
            </Button>
        </div>
    );

    return (
        <>
            <Head title="Checkout" />
            <HeroSection
                auth={auth}
                section="Checkout"
                title="Complete your purchase"
            />

            <main className="container mx-auto px-4 py-8">
                <div className="lg:grid lg:grid-cols-12 lg:gap-12">
                    <div className="lg:col-span-7">
                        <form 
                            id="checkout-form"
                            onSubmit={handleSubmit} 
                            className="space-y-6"
                        >
                            {renderFormField("Full Name", "name")}
                            {renderFormField("Email", "email", "email")}
                            {renderFormField("Shipping Address", "address")}
                            <div className="grid grid-cols-2 gap-4">
                                {renderFormField("City", "city")}
                                {renderFormField("Postal Code", "postal_code")}
                            </div>
                            {renderFormField("Phone Number", "phone", "tel")}
                        </form>
                    </div>
                    {renderOrderSummary()}
                </div>
            </main>
        </>
    );
};

export default Index; 