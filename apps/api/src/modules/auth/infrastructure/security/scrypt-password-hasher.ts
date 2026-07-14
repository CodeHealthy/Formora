import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

import type { PasswordHasher } from "../../application/ports/password-hasher.js";

const keyLength = 64;
const cost = 16_384;
const blockSize = 8;
const parallelization = 1;
const maxmem = 64 * 1024 * 1024;

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      keyLength,
      { N: cost, r: blockSize, p: parallelization, maxmem },
      (error, derivedKey) => {
        if (error !== null) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      },
    );
  });
}

export class ScryptPasswordHasher implements PasswordHasher {
  public async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derivedKey = await deriveKey(password, salt);

    return [
      "scrypt",
      String(cost),
      String(blockSize),
      String(parallelization),
      salt.toString("base64url"),
      derivedKey.toString("base64url"),
    ].join("$");
  }

  public async verify(password: string, passwordHash: string): Promise<boolean> {
    const [algorithm, storedCost, storedBlockSize, storedParallelization, salt, hash] =
      passwordHash.split("$");

    if (
      algorithm !== "scrypt" ||
      storedCost !== String(cost) ||
      storedBlockSize !== String(blockSize) ||
      storedParallelization !== String(parallelization) ||
      salt === undefined ||
      hash === undefined
    ) {
      return false;
    }

    const expectedHash = Buffer.from(hash, "base64url");
    const derivedKey = await deriveKey(password, Buffer.from(salt, "base64url"));

    return expectedHash.length === derivedKey.length && timingSafeEqual(expectedHash, derivedKey);
  }
}
