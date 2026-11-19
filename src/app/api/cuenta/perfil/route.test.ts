import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionUserId = vi.fn();
vi.mock('@/lib/auth/session', () => ({ getSessionUserId: () => getSessionUserId() }));

const getUserProfile = vi.fn();
const updateUserProfile = vi.fn();
vi.mock('@/lib/db/queries', () => ({
    getUserProfile: (userId: number) => getUserProfile(userId),
    updateUserProfile: (userId: number, input: unknown) => updateUserProfile(userId, input),
}));

import { GET, PATCH } from './route';

const URL = 'http://localhost/api/cuenta/perfil';
const patch = (body: string) => PATCH(new Request(URL, { method: 'PATCH', body }));
const patchJson = (body: unknown) => patch(JSON.stringify(body));

const profile = {
    name: 'Ana',
    lastName: 'López',
    email: 'ana@example.com',
    phone: '600123456',
    idCard: null,
};
const valid = { name: 'Ana', lastName: 'López', phone: '600 123 456' };
const NO_SESSION = { message: 'Inicia sesión para continuar' };

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    getSessionUserId.mockReset().mockResolvedValue(12);
    getUserProfile.mockReset().mockResolvedValue(profile);
    updateUserProfile.mockReset().mockResolvedValue(profile);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    consoleError.mockRestore();
});

describe('GET /api/cuenta/perfil', () => {
    it('devuelve el perfil de la cuenta de la sesión, con los nulos tal cual', async () => {
        const response = await GET();
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ profile });
        expect(getUserProfile).toHaveBeenCalledWith(12);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('sin sesión responde 401 y no consulta la BD', async () => {
        getSessionUserId.mockResolvedValue(null);
        const response = await GET();
        expect(response.status).toBe(401);
        expect(await response.json()).toEqual(NO_SESSION);
        expect(getUserProfile).not.toHaveBeenCalled();
    });

    it('si la cuenta ya no existe, 401', async () => {
        getUserProfile.mockResolvedValue(null);
        expect((await GET()).status).toBe(401);
    });

    it('un error de la BD da 500 sin filtrar el mensaje', async () => {
        getUserProfile.mockRejectedValue(new Error('select secreto'));
        const response = await GET();
        expect(response.status).toBe(500);
        expect(JSON.stringify(await response.json())).not.toContain('secreto');
    });
});

describe('PATCH /api/cuenta/perfil', () => {
    it('guarda los datos normalizados de la cuenta de la sesión y devuelve el perfil', async () => {
        const response = await patchJson(valid);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ profile });
        expect(updateUserProfile).toHaveBeenCalledWith(12, {
            name: 'Ana',
            lastName: 'López',
            phone: '600123456',
            idCard: null,
        });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('guarda el NIF en mayúsculas', async () => {
        await patchJson({ ...valid, idCard: ' 12345678z ' });
        expect(updateUserProfile.mock.calls[0][1].idCard).toBe('12345678Z');
    });

    it('ignora el correo y la cuenta que mande el navegador', async () => {
        await patchJson({ ...valid, email: 'otro@x.com', userId: 99 });
        expect(updateUserProfile).toHaveBeenCalledWith(
            12,
            expect.not.objectContaining({ email: expect.anything() }),
        );
        expect(updateUserProfile.mock.calls[0][0]).toBe(12);
    });

    it('sin sesión responde 401 antes de leer el cuerpo', async () => {
        getSessionUserId.mockResolvedValue(null);
        const response = await patch('no es json');
        expect(response.status).toBe(401);
        expect(updateUserProfile).not.toHaveBeenCalled();
    });

    it('un cuerpo que no es JSON da 400', async () => {
        const response = await patch('{no');
        expect(response.status).toBe(400);
        expect(updateUserProfile).not.toHaveBeenCalled();
    });

    it('datos inválidos dan 400 con los errores por campo en español', async () => {
        const response = await patchJson({ name: '', lastName: 'L', phone: '123', idCard: '1' });
        expect(response.status).toBe(400);
        const { errors } = await response.json();
        expect(Object.keys(errors).sort()).toEqual(['idCard', 'name', 'phone']);
        expect(errors.name[0]).toBe('El nombre es obligatorio');
        expect(updateUserProfile).not.toHaveBeenCalled();
    });

    it('un NIF de otra cuenta (clave duplicada) da 409', async () => {
        updateUserProfile.mockRejectedValue({
            code: 'ER_DUP_ENTRY',
            sqlMessage: "Duplicate entry 'X' for key 'users.id_card'",
        });
        const response = await patchJson({ ...valid, idCard: 'X1234567' });
        expect(response.status).toBe(409);
        expect((await response.json()).message).toContain('NIF');
    });

    it('otra clave duplicada no se confunde con el NIF: 500', async () => {
        updateUserProfile.mockRejectedValue({
            code: 'ER_DUP_ENTRY',
            sqlMessage: "Duplicate entry 'x' for key 'users.email'",
        });
        expect((await patchJson(valid)).status).toBe(500);
    });

    it('si la cuenta ya no existe, 401', async () => {
        updateUserProfile.mockResolvedValue(null);
        expect((await patchJson(valid)).status).toBe(401);
    });

    it('un error de la BD da 500 sin filtrar el mensaje', async () => {
        updateUserProfile.mockRejectedValue(new Error('update secreto'));
        const response = await patchJson(valid);
        expect(response.status).toBe(500);
        expect(JSON.stringify(await response.json())).not.toContain('secreto');
    });
});
