import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { utf8ToBytes } from '@noble/hashes/utils';
import { getSitePassword, getSiteSalt } from './env';

const toHex = (bytes: Uint8Array): string => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

const hexToBytes = (hex: string): Uint8Array | null => {
  const clean = hex.trim().toLowerCase();
  if (clean.length === 0 || clean.length % 2 !== 0) {
    return null;
  }

  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    const byte = Number.parseInt(clean.slice(i, i + 2), 16);
    if (Number.isNaN(byte)) {
      return null;
    }
    out[i / 2] = byte;
  }
  return out;
};

const timingSafeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
};

export const createHash = (value: string): string => {
  const key = utf8ToBytes(getSiteSalt());
  const message = utf8ToBytes(value);
  const digest = hmac(sha256, key, message);
  return toHex(digest);
};

export const expectedToken = (): string => createHash(getSitePassword());

export const isRequestAuthenticated = (token?: string | null): boolean => {
  if (!token) {
    return false;
  }
  let expectedBytes: Uint8Array | null = null;
  try {
    expectedBytes = hexToBytes(expectedToken());
  } catch (error) {
    console.error('[auth] Unable to resolve SITE_ACCESS_PASSWORD while evaluating request authentication.', error);
    return false;
  }

  const candidateBytes = hexToBytes(token);

  if (!expectedBytes || !candidateBytes) {
    return false;
  }

  return timingSafeEqual(expectedBytes, candidateBytes);
};
