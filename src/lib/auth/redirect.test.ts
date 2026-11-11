import { describe, expect, it } from 'vitest';
import { safeCallbackUrl } from './redirect';

describe('safeCallbackUrl', () => {
    it.each([
        [undefined, '/'],
        ['/cuenta', '/cuenta'],
        ['/cuenta?tab=pedidos', '/cuenta?tab=pedidos'],
        ['//evil.com', '/'],
        ['/\\evil.com', '/'],
        ['https://evil.com', '/'],
        [['/a', '/b'], '/'],
    ])('%s → %s', (path, expected) => {
        expect(safeCallbackUrl(path)).toBe(expected);
    });
});
