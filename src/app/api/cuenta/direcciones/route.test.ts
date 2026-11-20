import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionUserId = vi.fn();
vi.mock('@/lib/auth/session', () => ({ getSessionUserId: () => getSessionUserId() }));

const getUserAddresses = vi.fn();
const createUserAddress = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    getUserAddresses: (userId: number) => getUserAddresses(userId),
    createUserAddress: (userId: number, input: unknown, replaces?: number) =>
        createUserAddress(userId, input, replaces),
}));

import { GET, POST } from './route';

const URL = 'http://localhost/api/cuenta/direcciones';
const post = (body: string) => POST(new Request(URL, { method: 'POST', body }));
const postJson = (body: unknown) => post(JSON.stringify(body));

const valid = {
    recipientName: 'Ana García López',
    phone: '600123456',
    streetType: 'Calle',
    streetName: 'Larios',
    number: '5',
    floor: null,
    postalCode: '29005',
    city: 'Málaga',
    province: 'Málaga',
    country: 'España',
    addressType: 'Envío',
};
const saved = { id: 3, ...valid };
const NO_SESSION = { message: 'Inicia sesión para continuar' };

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    getSessionUserId.mockReset().mockResolvedValue(12);
    getUserAddresses.mockReset();
    createUserAddress.mockReset().mockResolvedValue(saved);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleError.mockRestore();
});

describe('GET /api/cuenta/direcciones', () => {
    it('devuelve las direcciones vigentes de la cuenta de la sesión', async () => {
        getUserAddresses.mockResolvedValue([saved]);

        const response = await GET();

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ addresses: [saved] });
        expect(getUserAddresses).toHaveBeenCalledWith(12);
    });

    it('sin direcciones devuelve una lista vacía', async () => {
        getUserAddresses.mockResolvedValue([]);
        expect(await (await GET()).json()).toEqual({ addresses: [] });
    });

    it('sin sesión responde 401 y no consulta la BD', async () => {
        getSessionUserId.mockResolvedValue(null);
        const response = await GET();
        expect(response.status).toBe(401);
        expect(await response.json()).toEqual(NO_SESSION);
        expect(getUserAddresses).not.toHaveBeenCalled();
    });

    it('no deja que se guarde la respuesta', async () => {
        getUserAddresses.mockResolvedValue([]);
        expect((await GET()).headers.get('Cache-Control')).toBe('no-store');
    });

    it('un error de la BD da 500 sin filtrar el mensaje', async () => {
        getUserAddresses.mockRejectedValue(new Error('select secreto'));
        const response = await GET();
        expect(response.status).toBe(500);
        expect(JSON.stringify(await response.json())).not.toContain('secreto');
    });

    it('una sesión de una cuenta que ya no existe da 401', async () => {
        getUserAddresses.mockRejectedValue({
            code: 'ER_NO_REFERENCED_ROW_2',
            message: 'a foreign key constraint fails (`addresses_user_id_users_user_id_fk`)',
        });
        expect((await GET()).status).toBe(401);
    });
});

describe('POST /api/cuenta/direcciones', () => {
    it('crea la dirección en la cuenta de la sesión y responde 201', async () => {
        const response = await postJson(valid);

        expect(response.status).toBe(201);
        expect(await response.json()).toEqual({ address: saved });
        expect(createUserAddress).toHaveBeenCalledWith(12, valid, undefined);
    });

    it('guarda lo normalizado: teléfono con prefijo y piso vacío', async () => {
        await postJson({ ...valid, phone: '+34 600 12 34 56', floor: '  ' });
        expect(createUserAddress).toHaveBeenCalledWith(
            12,
            expect.objectContaining({ phone: '600123456', floor: null }),
            undefined,
        );
    });

    it('ignora un userId del cuerpo: la cuenta es la de la sesión', async () => {
        await postJson({ ...valid, userId: 99, isActive: false, id: 5 });
        const [userId, input] = createUserAddress.mock.calls[0];
        expect(userId).toBe(12);
        expect(input).not.toHaveProperty('userId');
        expect(input).not.toHaveProperty('isActive');
        expect(input).not.toHaveProperty('id');
    });

    it('con replaces, pasa el id de la dirección que sustituye', async () => {
        await postJson({ ...valid, replaces: 3 });
        expect(createUserAddress).toHaveBeenCalledWith(12, valid, 3);
    });

    it('si replaces no es una dirección vigente de la cuenta, responde 404', async () => {
        createUserAddress.mockResolvedValue(null);
        const response = await postJson({ ...valid, replaces: 77 });
        expect(response.status).toBe(404);
    });

    it('sin sesión responde 401 antes de leer el cuerpo', async () => {
        getSessionUserId.mockResolvedValue(null);
        const response = await post('{ no es json');
        expect(response.status).toBe(401);
        expect(createUserAddress).not.toHaveBeenCalled();
    });

    it('un cuerpo que no es JSON da 400', async () => {
        const response = await post('{ no es json');
        expect(response.status).toBe(400);
        expect(createUserAddress).not.toHaveBeenCalled();
    });

    it('una dirección no válida da 400 con el error de cada campo', async () => {
        const response = await postJson({ ...valid, postalCode: '53001', phone: '123' });
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(Object.keys(body.errors).sort()).toEqual(['phone', 'postalCode']);
        expect(createUserAddress).not.toHaveBeenCalled();
    });

    it('una cuenta que ya no existe da 401', async () => {
        createUserAddress.mockRejectedValue({
            errno: 1452,
            sqlMessage: 'Cannot add or update a child row: `addresses_user_id_users_user_id_fk`',
        });
        expect((await postJson(valid)).status).toBe(401);
    });

    it('un error de la BD da 500 sin filtrar el mensaje', async () => {
        createUserAddress.mockRejectedValue(new Error('insert secreto'));
        const response = await postJson(valid);
        expect(response.status).toBe(500);
        expect(JSON.stringify(await response.json())).not.toContain('secreto');
    });
});
