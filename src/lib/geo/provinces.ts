/**
 * Provincias de España por código (los dos primeros dígitos del código postal, del 01 al 52).
 * Es la lista de códigos de provincia del INE y de Correos; los nombres son los de uso habitual en
 * las tiendas (en la lengua propia donde es oficial: `Girona`, `Gipuzkoa`, `Bizkaia`, `A Coruña`).
 */
const PROVINCES: Readonly<Record<string, string>> = {
    '01': 'Álava',
    '02': 'Albacete',
    '03': 'Alicante',
    '04': 'Almería',
    '05': 'Ávila',
    '06': 'Badajoz',
    '07': 'Baleares',
    '08': 'Barcelona',
    '09': 'Burgos',
    '10': 'Cáceres',
    '11': 'Cádiz',
    '12': 'Castellón',
    '13': 'Ciudad Real',
    '14': 'Córdoba',
    '15': 'A Coruña',
    '16': 'Cuenca',
    '17': 'Girona',
    '18': 'Granada',
    '19': 'Guadalajara',
    '20': 'Gipuzkoa',
    '21': 'Huelva',
    '22': 'Huesca',
    '23': 'Jaén',
    '24': 'León',
    '25': 'Lleida',
    '26': 'La Rioja',
    '27': 'Lugo',
    '28': 'Madrid',
    '29': 'Málaga',
    '30': 'Murcia',
    '31': 'Navarra',
    '32': 'Ourense',
    '33': 'Asturias',
    '34': 'Palencia',
    '35': 'Las Palmas',
    '36': 'Pontevedra',
    '37': 'Salamanca',
    '38': 'Santa Cruz de Tenerife',
    '39': 'Cantabria',
    '40': 'Segovia',
    '41': 'Sevilla',
    '42': 'Soria',
    '43': 'Tarragona',
    '44': 'Teruel',
    '45': 'Toledo',
    '46': 'Valencia',
    '47': 'Valladolid',
    '48': 'Bizkaia',
    '49': 'Zamora',
    '50': 'Zaragoza',
    '51': 'Ceuta',
    '52': 'Melilla',
};

/**
 * Provincia de un código postal español.
 *
 * @param postalCode - Código postal de 5 dígitos.
 * @returns El nombre de la provincia, o `null` si no son 5 dígitos o su código (los dos primeros)
 * no está entre 01 y 52.
 *
 * @example
 * provinceFromPostalCode('29005'); // 'Málaga'
 * provinceFromPostalCode('53001'); // null
 */
export function provinceFromPostalCode(postalCode: string): string | null {
    if (!/^\d{5}$/.test(postalCode)) return null;
    return PROVINCES[postalCode.slice(0, 2)] ?? null;
}
