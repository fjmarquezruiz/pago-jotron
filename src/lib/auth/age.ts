/**
 * Comprueba que una cadena `AAAA-MM-DD` es una fecha real del calendario (RF2).
 * Rechaza formatos distintos y días que no existen (30 de febrero, 31 de abril, 29 de febrero
 * en año no bisiesto).
 * @param value Fecha en formato `AAAA-MM-DD`.
 * @returns `true` si la fecha existe; `false` si el formato o la fecha no son válidos.
 */
export function isRealDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const [year, month, day] = value.split('-').map(Number);
    if (year < 1 || month < 1 || month > 12 || day < 1) return false;

    const date = new Date(Date.UTC(year, month - 1, day));
    // Date.UTC trata los años 0-99 como 1900-1999, así que se fija el año de forma explícita.
    date.setUTCFullYear(year);
    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

/**
 * Comprueba si una persona es mayor de edad (18 años o más) en una fecha dada (RF2).
 * @param birthDate Fecha de nacimiento en formato `AAAA-MM-DD`.
 * @param today Fecha de referencia; por defecto, hoy. Se pasa en los tests para fijarla.
 * @returns `true` si tiene 18 años o más; `false` si es menor o la fecha no es válida.
 */
export function isAdult(birthDate: string, today = new Date()): boolean {
    const [year, month, day] = birthDate.split('-').map(Number);
    if (!year || !month || !day || month > 12 || day > 31) return false;

    const age = today.getFullYear() - year;
    const monthDiff = today.getMonth() - (month - 1);
    const dayDiff = today.getDate() - day;

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        return age - 1 >= 18;
    }

    return age >= 18;
}
