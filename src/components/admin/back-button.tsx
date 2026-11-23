'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

/** «Volver»: a la página anterior del historial (Figma: admin-error-404). */
export function BackButton() {
    const router = useRouter();
    return (
        <Button type="button" variant="outline" onClick={() => router.back()}>
            Volver
        </Button>
    );
}
