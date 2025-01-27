import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextAreaInput from "@/Components/TextAreaInput";
import TextInput from "@/Components/TextInput";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Transition } from "@headlessui/react";
import { Head, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";

/**
 * A React component for creating a new feature.
 *
 * @returns {JSX.Element} A JSX element representing the create feature form.
 */
export default function Create() {
    const { data, setData, processing, errors, post, recentlySuccessful } =
        useForm({
            name: "",
            description: "",
        });

    /**
     * Handles the form submission event.
     *
     * @param {React.FormEvent<HTMLFormElement>} ev - The form submission event.
     */
    const createFeature: FormEventHandler = (ev) => {
        ev.preventDefault();
        post(route("feature.store"), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Create new feature
                </h2>
            }
        >
            <Head title="Create new feature" />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800 mb-4">
                <div className="p-6 text-gray-900 dark:text-gray-100 flex gap-8">
                    <form onSubmit={createFeature} className="flex-1 space-y-6">
                        <div>
                            <InputLabel htmlFor="name" value="Name" />

                            <TextInput
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                required
                                isFocused
                                autoComplete="name"
                            />

                            <InputError
                                message={errors.name}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="description"
                                value="Description"
                            />

                            <TextAreaInput
                                id="description"
                                className="mt-1 block w-full"
                                value={data.description}
                                onChange={(e) =>
                                    setData("description", e.target.value)
                                }
                            />

                            <InputError
                                message={errors.description}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>
                                Save
                            </PrimaryButton>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Saved.
                                </p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
