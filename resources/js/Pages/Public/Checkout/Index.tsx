import InputError from "@/Components/InputError";
import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Direccion, PageProps } from "@/types";
import { Head, useForm } from "@inertiajs/react";
import { ChangeEvent, FormEventHandler, useEffect, useState } from "react";
import HeroSection from "../Layout/HeroSection";

interface CheckoutFormData {
    name: string;
    last_name: string;
    email: string;
    id_card: string;

    shipping_address: string;
    shipping_apartment: string;
    shipping_postal_code: string;
    shipping_city: string;
    shipping_state: string;
    shipping_country: string;
    shipping_phone: string;

    billing_address: string;
    billing_apartment: string;
    billing_postal_code: string;
    billing_city: string;
    billing_state: string;
    billing_country: string;
    billing_phone: string;

    items: {
        id: number;
        quantity: number;
        price: number;
    }[];
}

interface FormFieldProps {
    label: string;
    name: keyof CheckoutFormData;
    type: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    required?: boolean;
    readOnly?: boolean;
}

const Index = ({ auth }: PageProps) => {
    const { state, dispatch } = useCart();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addresses, setAddresses] = useState<Direccion[]>([]);
    const [sameAddress, setSameAddress] = useState(false);

    const [hasShippingAddress, setHasShippingAddress] = useState(false);
    const [hasBillingAddress, setHasBillingAddress] = useState(false);

    const { data, setData, processing, errors } = useForm<CheckoutFormData>({
        name: auth?.user?.name || "",
        last_name: auth?.user?.last_name || "",
        email: auth?.user?.email || "",
        id_card: auth?.user?.id_card || "",
        shipping_address: "",
        shipping_apartment: "",
        shipping_postal_code: "",
        shipping_city: "",
        shipping_state: "",
        shipping_country: "",
        shipping_phone: auth?.user?.phone_number || "",

        billing_address: "",
        billing_apartment: "",
        billing_postal_code: "",
        billing_city: "",
        billing_state: "",
        billing_country: "",
        billing_phone: "",

        items: state.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
        })),
    });

    useEffect(() => {
        const fetchData = async (
            url: string,
            setState: React.Dispatch<React.SetStateAction<Direccion[]>>,
            directData: boolean = false,
        ) => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                if (!Array.isArray(directData ? data : data.data)) {
                    throw new Error(`${url} data is not an array`);
                }
                setState(directData ? data : data.data);
            } catch (err) {
                console.error(`Error fetching data from ${url}:`, err);
                setError(
                    `Failed to load data from ${url}. Please try again later.`,
                );
            }
        };

        const fetchAllData = async () => {
            await Promise.all([
                fetchData(
                    `/users/${auth.user.id}/direcciones`,
                    setAddresses,
                    false,
                ),
            ]);

            // setData("addresses", addresses);
            console.log("addresses", addresses);
            console.log(
                addresses.find(
                    (dir) => dir.address_type.toLowerCase() === "shipping",
                ),
            );

            const shippingAddress = addresses.find(
                (dir) => dir.address_type.toLowerCase() === "shipping",
            );
            const billingAddress = addresses.find(
                (dir) => dir.address_type.toLowerCase() === "billing",
            );

            if (shippingAddress) {
                setHasShippingAddress(true);
                setData(
                    "shipping_address",
                    `${shippingAddress.street_type} ${shippingAddress.street_name}`,
                );
                setData("shipping_apartment", shippingAddress.street_number);
                setData("shipping_postal_code", shippingAddress.postal_code);
                setData("shipping_city", shippingAddress.city);
                setData("shipping_state", shippingAddress.state);
                setData("shipping_country", shippingAddress.country);
                setData("shipping_phone", shippingAddress.phone);
            }

            if (billingAddress) {
                setHasBillingAddress(true);
                setSameAddress(false);
                setData(
                    "billing_address",
                    `${billingAddress.street_type} ${billingAddress.street_name}`,
                );
                setData("billing_apartment", billingAddress.street_number);
                setData("billing_postal_code", billingAddress.postal_code);
                setData("billing_city", billingAddress.city);
                setData("billing_state", billingAddress.state);
                setData("billing_country", billingAddress.country);
                setData("billing_phone", billingAddress.phone);
            }

            setLoading(false);

            console.log(data);
        };

        fetchAllData();
    }, []);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setData(name as keyof CheckoutFormData, value);
    };

    // const handleSameAddressChange = (checked: boolean) => {
    //     setSameAddress(checked);
    //     if (checked) {
    //         const billingAddress = addresses.find(
    //             (addr) => addr.address_type.toLowerCase() === "billing",
    //         );
    //         if (billingAddress) {
    //             setData(
    //                 "address",
    //                 `${billingAddress.street_type} ${billingAddress.street_name}`,
    //             );
    //             setData("city", billingAddress.city);
    //             setData("postal_code", billingAddress.postal_code);
    //         }
    //     }
    // };

    const handleSameAddressChange = (checked: boolean) => {
        setSameAddress(checked);
        // if (checked && !hasBillingAddress) {
        //     setData("billing_address", data.shipping_address);
        // }
        // if (checked) {
        //     setData("billing_address", "");
        //     setData("billing_city", "");
        //     setData("billing_postal_code", "");
        //     setData("billing_phone", "");
        // }
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (state.items.length === 0) {
            toast({
                title: "Cart is empty",
                description:
                    "Please add items to your cart before checking out.",
                variant: "destructive",
            });
            return;
        }

        // Update items before submission to ensure latest cart state
        const formData = {
            ...data,
            items: state.items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price,
            })),
        };

        console.log("formDAta -> ", formData);
        // exit;

        // router.post(route("checkout.process"), formData, {
        //     onSuccess: () => {
        //         toast({
        //             title: "Order placed successfully",
        //             description: "Thank you for your purchase!",
        //         });
        //         // Clear the cart by removing all items
        //         state.items.forEach((item) => {
        //             dispatch({ type: "REMOVE_ITEM", itemId: item.id });
        //         });
        //         localStorage.removeItem(CART_STORAGE_KEY);
        //     },
        //     onError: () => {
        //         toast({
        //             title: "Error",
        //             description: "There was a problem processing your order.",
        //             variant: "destructive",
        //         });
        //     },
        // });
    };

    const renderFormField = ({
        label,
        name,
        type,
        value,
        onChange,
        className = "",
        required = false,
        readOnly = false,
    }: FormFieldProps) => (
        <div className={cn("flex flex-col gap-1.5", className)}>
            {/* <label
                htmlFor={name}
                className="font-sm-medium block text-neutral-900"
            >
                {label}
            </label> */}
            <Label htmlFor={name}>{label}</Label>
            <Input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                className="font-base-medium-i h-12 px-5"
                required={required}
                readOnly={readOnly}
            />
            {errors[name] && (
                <InputError message={errors[name]} />
                // <p className="font-sm-regular text-red-600">{errors[name]}</p>
            )}
        </div>
    );

    const renderOrderSummary = () => (
        <div className="mb-18 flex flex-col gap-6 rounded border border-neutral-200 bg-neutral-50 px-4 py-4 sm:p-6 lg:col-span-3 lg:mt-0 lg:p-6">
            <h2 className="heading-xl-bold text-neutral-900">Order Summary</h2>
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

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <>
            <Head title="Checkout" />
            <HeroSection
                auth={auth}
                section="Checkout"
                title="Complete your purchase"
            />

            <div className="container mx-auto px-5 pb-32 pt-12">
                <div className="mx-auto flex max-w-7xl gap-6 lg:grid lg:grid-cols-12 lg:gap-6">
                    <div className="flex flex-col gap-12 pr-12 lg:col-span-9">
                        <h2 className="heading-3xl-bold">Shipping info</h2>
                        <form
                            id="checkout-form"
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-4"
                        >
                            <div className="grid gap-6 lg:grid-cols-2">
                                {renderFormField({
                                    label: "Full name",
                                    name: "name",
                                    type: "text",
                                    value: data.name,
                                    onChange: handleInputChange,
                                    className: "col-span-2",
                                    required: true,
                                })}
                                {renderFormField({
                                    label: "Last name",
                                    name: "last_name",
                                    type: "text",
                                    value: data.last_name,
                                    onChange: handleInputChange,
                                    className: "col-span-1",
                                    required: true,
                                })}
                            </div>

                            {renderFormField({
                                label: "Email",
                                name: "email",
                                type: "email",
                                value: data.email,
                                onChange: handleInputChange,
                                required: true,
                                readOnly: true,
                            })}

                            {/* Check if shippingAddress is not empty */}
                            {hasShippingAddress ? (
                                <>
                                    {renderFormField({
                                        label: "Address",
                                        name: "shipping_address",
                                        type: "text",
                                        value: data.shipping_address,
                                        onChange: handleInputChange,
                                        required: true,
                                    })}

                                    <div className="grid gap-6 lg:grid-cols-3">
                                        {/* Apartment, suite, etc. */}
                                        {renderFormField({
                                            label: "Apartment, suite, etc.",
                                            name: "shipping_apartment",
                                            type: "text",
                                            value: data.shipping_apartment,
                                            onChange: handleInputChange,
                                        })}
                                        {/* Postal Code */}
                                        {renderFormField({
                                            label: "ZIP Code / CP",
                                            name: "shipping_postal_code",
                                            type: "text",
                                            value: data.shipping_postal_code,
                                            onChange: handleInputChange,
                                            required: true,
                                        })}
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-3">
                                        {/* City */}
                                        {renderFormField({
                                            label: "City",
                                            name: "shipping_city",
                                            type: "text",
                                            value: data.shipping_city,
                                            onChange: handleInputChange,
                                            required: true,
                                        })}
                                        {/* State */}
                                        {renderFormField({
                                            label: "State",
                                            name: "shipping_state",
                                            type: "text",
                                            value: data.shipping_state,
                                            onChange: handleInputChange,
                                            required: true,
                                        })}
                                        {/* Country */}
                                        {renderFormField({
                                            label: "Country",
                                            name: "shipping_country",
                                            type: "text",
                                            value: data.shipping_country,
                                            onChange: handleInputChange,
                                            required: true,
                                        })}
                                    </div>
                                    <div className="grid gap-6 lg:grid-cols-2">
                                        {renderFormField({
                                            label: "Phone Number",
                                            name: "shipping_phone",
                                            type: "tel",
                                            value: data.shipping_phone,
                                            onChange: handleInputChange,
                                            required: true,
                                        })}
                                    </div>
                                </>
                            ) : (
                                <p>No shipping address found.</p>
                            )}

                            {/* CIF/VAT (Necesario si quieres factura)*/}
                            <div className="grid items-end gap-6 lg:grid-cols-2">
                                {renderFormField({
                                    label: "CIF/VAT (Necesario si quieres factura)",
                                    name: "id_card",
                                    type: "text",
                                    value: data.id_card,
                                    onChange: handleInputChange,
                                })}
                                <div className="col-span-1 flex min-h-10 items-center gap-2">
                                    <Checkbox
                                        id="same_address"
                                        checked={sameAddress}
                                        onCheckedChange={(checked) =>
                                            handleSameAddressChange(checked)
                                        }
                                        className="mt-0.5"
                                    />
                                    <label
                                        htmlFor="same_address"
                                        className="font-sm-medium"
                                    >
                                        Billing address same as delivery address
                                    </label>
                                </div>
                            </div>

                            {/* Billing Information */}
                            {!sameAddress && (
                                <>
                                    <h2 className="heading-3xl-bold my-8">
                                        Billing info
                                    </h2>

                                    <div className="grid gap-6 lg:grid-cols-2">
                                        {renderFormField({
                                            label: "Full name",
                                            name: "name",
                                            type: "text",
                                            value: data.name,
                                            onChange: handleInputChange,
                                            required: true,
                                        })}
                                        {renderFormField({
                                            label: "Last name",
                                            name: "last_name",
                                            type: "text",
                                            value: data.last_name,
                                            onChange: handleInputChange,
                                            required: true,
                                        })}
                                    </div>

                                    {renderFormField({
                                        label: "Email",
                                        name: "email",
                                        type: "email",
                                        value: data.email,
                                        onChange: handleInputChange,
                                        required: true,
                                    })}

                                    {/* Check if billingAddress is not empty */}
                                    {hasBillingAddress ? (
                                        <>
                                            {renderFormField({
                                                label: "Billing Address",
                                                name: "billing_address",
                                                type: "text",
                                                value: data.billing_address,
                                                onChange: handleInputChange,
                                                required: true,
                                            })}

                                            <div className="grid gap-6 lg:grid-cols-3">
                                                {/* Apartment, suite, etc. */}
                                                {renderFormField({
                                                    label: "Apartment, suite, etc.",
                                                    name: "billing_apartment",
                                                    type: "text",
                                                    value:
                                                        data.billing_apartment ||
                                                        "",
                                                    onChange: handleInputChange,
                                                    className: "col-span-2",
                                                })}
                                                {/* Postal Code */}
                                                {renderFormField({
                                                    label: "ZIP Code / CP",
                                                    name: "billing_postal_code",
                                                    type: "text",
                                                    value: data.billing_postal_code,
                                                    onChange: handleInputChange,
                                                    className: "col-span-1",
                                                    required: true,
                                                })}
                                            </div>

                                            <div className="grid gap-6 lg:grid-cols-3">
                                                {/* City */}
                                                {renderFormField({
                                                    label: "City",
                                                    name: "billing_city",
                                                    type: "text",
                                                    value: data.billing_city,
                                                    onChange: handleInputChange,
                                                    required: true,
                                                })}
                                                {/* State */}
                                                {renderFormField({
                                                    label: "State",
                                                    name: "billing_state",
                                                    type: "text",
                                                    value:
                                                        data.billing_state ||
                                                        "",
                                                    onChange: handleInputChange,
                                                })}
                                                {/* Country */}
                                                {renderFormField({
                                                    label: "Country",
                                                    name: "billing_country",
                                                    type: "text",
                                                    value:
                                                        data.billing_country ||
                                                        "",
                                                    onChange: handleInputChange,
                                                    required: true,
                                                })}
                                            </div>
                                        </>
                                    ) : (
                                        <p>No billing address found.</p>
                                    )}

                                    <div className="grid gap-6 lg:grid-cols-2">
                                        {renderFormField({
                                            label: "Phone Number",
                                            name: "billing_phone",
                                            type: "tel",
                                            value: data.billing_phone,
                                            onChange: handleInputChange,
                                            required: true,
                                        })}
                                    </div>
                                </>
                            )}

                            {/* Render Addresses */}
                            <div className="mt-6">
                                <h3 className="heading-sm-bold">
                                    Saved Addresses
                                </h3>
                                {addresses.length > 0 ? (
                                    <ul>
                                        {addresses.map((direccion) => (
                                            <li key={direccion.id}>
                                                {direccion.street_type}{" "}
                                                {direccion.street_name}{" "}
                                                {direccion.street_number},{" "}
                                                {direccion.city},{" "}
                                                {direccion.state},{" "}
                                                {direccion.country} (
                                                {direccion.address_type})
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No saved addresses found.</p>
                                )}
                            </div>
                        </form>
                    </div>
                    {renderOrderSummary()}
                </div>
            </div>
        </>
    );
};

export default Index;
