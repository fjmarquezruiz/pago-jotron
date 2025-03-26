"use client";

import { Alert, AlertDescription } from "@/Components/ui/alert";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { IconAlertTriangleFilled } from "@tabler/icons-react";
import { FormEventHandler, useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

interface FormData {
    day: string;
    month: string;
    year: string;
}

export default function Index() {
    const [day, setDay] = useState<string>("");
    const [month, setMonth] = useState<string>("");
    const [year, setYear] = useState<string>("");
    const [isFormComplete, setIsFormComplete] = useState(false);
    const [isUnderage, setIsUnderage] = useState(false);
    // const router = useRouter();

    // Generar arrays para los selects
    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
    const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

    // Generar años desde el actual hasta 100 años atrás
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) =>
        (currentYear - i).toString(),
    );

    const { data, setData, post, processing, errors, reset } =
        useForm<FormData>({
            day: "",
            month: "",
            year: "",
        });

    // Verificar si todos los campos están completos
    useEffect(() => {
        setIsFormComplete(!!day && !!month && !!year);
        // Resetear el mensaje de error cuando el usuario cambia la fecha
        if (isUnderage && (day || month || year)) {
            setIsUnderage(false);
        }
    }, [day, month, year, isUnderage]);

    useEffect(() => {
        // Log state changes for debugging
        console.log("isUnderage:", isUnderage);
    }, [isUnderage]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        console.log("SUBMITTTTTT");
        verifyAge();
    };

    const verifyAge = () => {
        try {
            // Validar que los valores sean números válidos
            const dayNum = Number.parseInt(day);
            const monthNum = Number.parseInt(month) - 1; // Los meses en JavaScript son 0-indexed
            const yearNum = Number.parseInt(year);

            if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
                console.error("Valores de fecha inválidos:", {
                    day,
                    month,
                    year,
                });
                return;
            }

            // Crear fecha de nacimiento
            const birthDate = new Date(yearNum, monthNum, dayNum);

            // Verificar que la fecha sea válida
            if (birthDate.toString() === "Invalid Date") {
                console.error("Fecha inválida:", birthDate);
                return;
            }

            // Calcular edad
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            // Ajustar la edad si aún no ha llegado el mes de cumpleaños
            // o si es el mes pero no ha llegado el día
            if (
                monthDiff < 0 ||
                (monthDiff === 0 && today.getDate() < birthDate.getDate())
            ) {
                age--;
            }

            console.log("Edad calculada:", age);

            // Verificar si es mayor de edad
            if (age >= 18) {
                // Guardar en localStorage y establecer cookie
                localStorage.setItem("ageVerified", "true");
                document.cookie = "ageVerified=true; path=/; max-age=86400"; // 24 horas

                // Redirigir a la página principal
                // router.push("/home");
                router.get(route("/"));
            } else {
                // Mostrar mensaje de error
                setIsUnderage(true);
            }
        } catch (error) {
            console.error("Error al verificar la edad:", error);
        }
    };

    return (
        <GuestLayout>
            <Head title="Age Verification" />
            <div className="flex w-96 flex-col items-center gap-8 text-center text-neutral-900">
                <h2 className="heading-3xl-regular">
                    Are you of legal drinking age?
                </h2>
                <p className="text-neutral-800">
                    Hey there! Before you dive into our amazing wine selection,
                    please confirm that you're of legal drinking age in your
                    country. Cheers and enjoy!
                </p>
                <form onSubmit={submit} className="flex w-full flex-col gap-4">
                    <div className="grid w-full grid-cols-3 gap-6">
                        <div className="flex flex-col items-start gap-1.5">
                            <Label htmlFor="day">Day</Label>

                            <Select value={day} onValueChange={setDay}>
                                <SelectTrigger id="day">
                                    <SelectValue placeholder="Day" />
                                </SelectTrigger>
                                <SelectContent className="rounded bg-white !px-0 !py-0">
                                    {days.map((d) => (
                                        <SelectItem key={`day-${d}`} value={d}>
                                            {d}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col items-start gap-1.5">
                            <Label htmlFor="month">Month</Label>

                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger id="month">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((m) => (
                                        <SelectItem
                                            key={`month-${m}`}
                                            value={m}
                                        >
                                            {m}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col items-start gap-1.5">
                            <Label htmlFor="year">Year</Label>

                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger id="year">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((y) => (
                                        <SelectItem key={`year-${y}`} value={y}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col items-center justify-end gap-4">
                        <Button
                            className="w-full"
                            variant="primary"
                            size="lg"
                            type="submit"
                            disabled={processing || !isFormComplete}
                        >
                            {processing ? "Processing..." : "CONFIRM"}
                        </Button>

                        {isUnderage && (
                            <Alert
                                variant="destructive"
                                className="border-red-500 bg-red-50 text-white"
                            >
                                <div className="font-sm-normal flex items-start gap-4 text-left text-neutral-900">
                                    <span>
                                        <IconAlertTriangleFilled
                                            stroke={1.5}
                                            className="size-4 text-red-600"
                                        />
                                    </span>
                                    <AlertDescription>
                                        Lo sentimos, debes ser mayor de 18 años
                                        para acceder a este sitio.{" "}
                                        <Link
                                            href="https://www.google.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-semibold underline"
                                        >
                                            Visitar Google.com
                                        </Link>
                                    </AlertDescription>
                                </div>
                            </Alert>
                        )}
                    </div>
                </form>

                <p className="text-center text-xs text-gray-500">
                    Al acceder, confirmas que tienes la edad legal para consumir
                    alcohol en tu país de residencia.
                </p>
            </div>
        </GuestLayout>
    );
}
