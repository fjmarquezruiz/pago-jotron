// import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { CheckedState } from "@radix-ui/react-checkbox";
import { FormEventHandler } from "react";

export default function Login({
    status,
    canResetPassword,
    redirect,
}: {
    status?: string;
    canResetPassword: boolean;
    redirect?: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("login"), {
            onSuccess: () => {
                const redirectPath = localStorage.getItem(
                    "redirect_after_login",
                );
                localStorage.removeItem("redirect_after_login");

                if (redirectPath === "cart") {
                    router.get(route("cart"));
                } else if (redirectPath === "checkout") {
                    router.get(route("checkout.index"));
                } else {
                    router.get(route("dashboard"));
                }
            },
            onFinish: () => reset("password"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="flex min-w-96 flex-col items-center gap-8 text-neutral-900">
                {status && (
                    <div className="mb-4 text-sm font-medium text-green-600">
                        {status}
                    </div>
                )}
                <h2 className="heading-3xl-regular text-center">
                    {/* Are you of legal drinking age? */}
                    Log in
                </h2>
                {/* <p className="text-neutral-800">
                        Hey there! Before you dive into our amazing wine
                        selection, please confirm that you're of legal drinking
                        age in your country. Cheers and enjoy!
                    </p> */}
                <form onSubmit={submit} className="flex w-full flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="email">Your email address</Label>

                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            autoComplete="username"
                            className="font-base-medium-i h-12 px-5"
                            onChange={(e) => setData("email", e.target.value)}
                        />

                        <InputError message={errors.email} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="password">Your password</Label>

                        <Input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            autoComplete="current-password"
                            className="font-base-medium-i h-12 px-5"
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                        />

                        {/* <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full"
                            autoComplete="current-password"
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                        /> */}

                        <InputError message={errors.password} />
                    </div>

                    {/* <div className="mt-4 block">
                        <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData("remember", e.target.checked)
                            }
                        />

                        <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
                                Remember me
                                </span>
                        </label>
                            </div> */}
                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onCheckedChange={(checked: CheckedState) =>
                                setData("remember", checked === true)
                            }
                            className="mt-0.5"
                        />
                        <Label htmlFor="remember">Remember me</Label>
                    </div>

                    <div className="mt-6 flex flex-col items-center justify-end gap-4">
                        <Button
                            className="w-full"
                            variant="primary"
                            size="lg"
                            type="submit"
                            // form="checkout-form"
                            disabled={processing}
                        >
                            {processing ? "Processing..." : "Log in"}
                        </Button>

                        {canResetPassword && (
                            <Link
                                href={route("password.request")}
                                className="w-full rounded-md text-center text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                            >
                                Forgot your password?
                            </Link>
                        )}

                        {/* <PrimaryButton className="ms-4" disabled={processing}>
                            Log in
                        </PrimaryButton> */}
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
