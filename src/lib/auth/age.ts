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
