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
import { Head, Link, useForm } from "@inertiajs/react";
import { IconAlertTriangleFilled } from "@tabler/icons-react";
import { FormEventHandler, useEffect, useState } from "react";

type DateKey = "day" | "month" | "year";

export default function AgeVerification() {
    const [dateOfBirth, setDateOfBirth] = useState({
        day: "",
        month: "",
        year: "",
    });
    const [isUnderage, setIsUnderage] = useState(false);
    const [isFormComplete, setIsFormComplete] = useState(false);
    const { post } = useForm();

    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
    const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) =>
        (currentYear - i).toString(),
    );

    useEffect(() => {
        const { day, month, year } = dateOfBirth;
        setIsFormComplete(!!day && !!month && !!year);
        setIsUnderage(false);
    }, [dateOfBirth]);

    const handleDateChange = (key: DateKey, value: string) => {
        setDateOfBirth((prev) => ({ ...prev, [key]: value }));
    };

    const verifyAge = () => {
        const { day, month, year } = dateOfBirth;
        const birthDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
        );

        if (isNaN(birthDate.getTime())) {
            console.error("Fecha inválida");
            return;
        }

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
            age--;
        }

        if (age >= 18) {
            localStorage.setItem("ageVerified", "true");
            document.cookie = "ageVerified=true; path=/; max-age=86400";
            // router.visit("/");
            post(route("age.verification.process"));
        } else {
            setIsUnderage(true);
        }
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        verifyAge();
    };

    return (
        <GuestLayout>
            <Head title="Age Verification" />
            <div className="flex w-96 flex-col items-center gap-8 text-center text-neutral-900">
                <h2 className="heading-3xl-regular">
                    Are you of legal drinking age?
                </h2>
                <p className="text-neutral-800">
                    Please confirm that you're of legal drinking age in your
                    country. Cheers!
                </p>
                <form
                    onSubmit={handleSubmit}
                    className="flex w-full flex-col gap-4"
                >
                    <div className="grid w-full grid-cols-3 gap-6">
                        {(["day", "month", "year"] as DateKey[]).map(
                            (key, index) => (
                                <div
                                    key={key}
                                    className="flex flex-col items-start gap-1.5"
                                >
                                    <Label htmlFor={key}>
                                        {key.charAt(0).toUpperCase() +
                                            key.slice(1)}
                                        {/* value={dateOfBirth[key as DateKey]} */}
                                    </Label>
                                    <Select
                                        value={dateOfBirth[key]}
                                        onValueChange={(value) =>
                                            handleDateChange(
                                                key as DateKey,
                                                value,
                                            )
                                        }
                                    >
                                        <SelectTrigger id={key}>
                                            <SelectValue
                                                placeholder={
                                                    key
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                    key.slice(1)
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(key === "day"
                                                ? days
                                                : key === "month"
                                                  ? months
                                                  : years
                                            ).map((value) => (
                                                <SelectItem
                                                    key={`${key}-${value}`}
                                                    value={value}
                                                >
                                                    {value}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ),
                        )}
                    </div>
                    <div className="mt-6 flex flex-col items-center justify-end gap-4">
                        <Button
                            className="w-full"
                            variant="primary"
                            size="lg"
                            type="submit"
                            disabled={!isFormComplete}
                        >
                            CONFIRM
                        </Button>
                        {isUnderage && (
                            <Alert
                                variant="destructive"
                                className="rounded border-red-500 bg-red-50 text-white"
                            >
                                <div className="flex items-start gap-2 text-left text-neutral-900">
                                    <span className="block py-0.5">
                                        <IconAlertTriangleFilled
                                            stroke={1.5}
                                            className="size-4 text-red-600"
                                        />
                                    </span>
                                    <AlertDescription>
                                        Lo sentimos, debes ser mayor de 18 años
                                        para acceder.{" "}
                                        <Link
                                            href="https://www.google.com"
                                            target="_blank"
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
                    alcohol en tu país.
                </p>
            </div>
        </GuestLayout>
    );
}
