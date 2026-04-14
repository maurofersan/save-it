import crypto from "node:crypto";

const SCRYPT_KEYLEN = 64;

export type PasswordHash = {
  algorithm: "scrypt";
  saltHex: string;
  hashHex: string;
};

export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = crypto.randomBytes(16);
  const hash = await scryptAsync(password, salt, SCRYPT_KEYLEN);
  return {
    algorithm: "scrypt",
    saltHex: salt.toString("hex"),
    hashHex: hash.toString("hex"),
  };
}

export async function verifyPassword(
  password: string,
  stored: PasswordHash,
): Promise<boolean> {
  if (stored.algorithm !== "scrypt") return false;
  const salt = Buffer.from(stored.saltHex, "hex");
  const expected = Buffer.from(stored.hashHex, "hex");
  const actual = await scryptAsync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
}

export function newToken(bytes: number = 32): string {
  // url-safe enough for cookies (hex)
  return crypto.randomBytes(bytes).toString("hex");
}

