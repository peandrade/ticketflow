import { setCookie, deleteCookie } from 'cookies-next/client';  
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('cookies-next/client', () => {
    return {
        setCookie: vi.fn(),
        deleteCookie: vi.fn(),
    };
});

import { useAuth } from '@/stores/auth';

describe('useAuth store', () => {
    beforeEach(() => {
        (useAuth as any).setState({ token: null, open: false });
        vi.clearAllMocks();
    })

    it('estado inicial', () => {
        const { token, open } = useAuth.getState();
        expect(token).toBeNull();
        expect(open).toBe(false);
    });

    it('setOpen altera o estado para "open"', () => {
        useAuth.getState().setOpen(true);
        expect(useAuth.getState().open).toBe(true)
    });

    it('setToken define tokene grava cookie', () => {
        useAuth.getState().setToken('abc123');
        expect(useAuth.getState().token).toBe('abc123');
        expect(setCookie).toHaveBeenCalledWith('token', 'abc123');
    });

    it('setToken(null) zera token e apaga cookie', () => {
        useAuth.getState().setToken(null);
        expect(useAuth.getState().token).toBeNull();
        expect(deleteCookie).toBeCalledWith('token');
    });
});