import { getSitePassword, getSiteSalt } from './env';

const encoder = new TextEncoder();

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

const getSubtle = () => {
  const crypto = globalThis.crypto;
  if (!crypto?.subtle) {
    throw new Error('Web Crypto API (crypto.subtle) is unavailable in this environment.');
  }
  return crypto.subtle;
};

const computeHmacSha256 = async (value: string, salt: string): Promise<Uint8Array> => {
  const subtle = getSubtle();
  const keyData = encoder.encode(salt);
  const message = encoder.encode(value);
  const key = await subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await subtle.sign('HMAC', key, message);
  return new Uint8Array(signature);
};

let cachedExpectedToken: Promise<string> | null = null;

export const createHash = async (value: string): Promise<string> => {
  const digest = await computeHmacSha256(value, getSiteSalt());
  return toHex(digest);
};

export const expectedToken = async (): Promise<string> => {
  if (!cachedExpectedToken) {
    cachedExpectedToken = createHash(getSitePassword());
  }
  return cachedExpectedToken;
};

export const isRequestAuthenticated = async (token?: string | null): Promise<boolean> => {
  if (!token) {
    return false;
  }

  let expectedHex: string;
  try {
    expectedHex = await expectedToken();
  } catch (error) {
    console.error('[auth] Unable to resolve SITE_ACCESS_PASSWORD while evaluating request authentication.', error);
    return false;
  }

  const expectedBytes = hexToBytes(expectedHex);
  const candidateBytes = hexToBytes(token);

  if (!expectedBytes || !candidateBytes) {
    return false;
  }

  return timingSafeEqual(expectedBytes, candidateBytes);
};
