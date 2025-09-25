import { cookies } from 'next/headers';
import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME } from './constants';
import { createHash, expectedToken, isRequestAuthenticated } from './auth-edge';

export const setAuthCookie = async () => {
  const cookieStore = cookies();
  const token = await expectedToken();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
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

export const verifyPassword = async (candidate: string): Promise<boolean> => {
  const candidateHash = await createHash(candidate);
  return await isRequestAuthenticated(candidateHash);
};
