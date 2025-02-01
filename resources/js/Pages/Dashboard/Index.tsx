import AuthenticatedLayout from "@/Layouts/Dashboard/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

const Index = () => {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                <div className="p-6 text-gray-900 dark:text-gray-100">
                    You're logged in /Dashboard!
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;
