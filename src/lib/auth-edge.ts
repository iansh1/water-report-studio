import crypto from 'node:crypto';
import { getSitePassword, getSiteSalt } from './env';

export const createHash = (value: string): string => {
  const salt = getSiteSalt();
  return crypto.createHmac('sha256', salt).update(value).digest('hex');
};

export const expectedToken = (): string => createHash(getSitePassword());

export const isRequestAuthenticated = (token?: string | null): boolean => {
  if (!token) {
    return false;
  }
  const expected = expectedToken();
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'));
  } catch (error) {
    return false;
  }
};
