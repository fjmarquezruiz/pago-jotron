import type { BadgeTone } from '@/components/ui/badge';

const TONES: Record<string, BadgeTone> = {
    Tinto: 'wine-red',
    Blanco: 'wine-white',
    Rosado: 'wine-rose',
    Dulce: 'wine-sweet',
    Generoso: 'wine-fortified',
};

/**
 * Tono del `Badge` para una tipología. El sistema de diseño solo tiene tono propio para tinto,
 * blanco, rosado, dulce y generoso; el resto (espumoso, pasas) usa el neutro.
 *
 * @param typologyName - Nombre de la tipología (`typologies.name`).
 * @returns El tono del `Badge`.
 *
 * @example
 * typologyTone('Tinto'); // 'wine-red'
 */
export function typologyTone(typologyName: string): BadgeTone {
    return TONES[typologyName] ?? 'neutral';
}
