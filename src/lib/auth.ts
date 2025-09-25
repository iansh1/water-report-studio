import { cookies } from 'next/headers';
import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME } from './constants';
import { createHash, expectedToken, isRequestAuthenticated } from './auth-edge';

export const setAuthCookie = () => {
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
};

export const clearAuthCookie = () => {
  cookies().delete(AUTH_COOKIE_NAME);
};

export const verifyPassword = (candidate: string): boolean => isRequestAuthenticated(createHash(candidate));
