import {
  createHash,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);
const SCRYPT_PREFIX = "scrypt$v1";
const SALT_BYTES = 16;
const KEY_BYTES = 32;

function toBase64Url(value: Buffer) {
  return value.toString("base64url");
}

function safeCompare(left: Buffer, right: Buffer) {
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = (await scrypt(password, salt, KEY_BYTES)) as Buffer;

  return `${SCRYPT_PREFIX}$${toBase64Url(salt)}$${toBase64Url(derivedKey)}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const normalizedHash = String(storedHash || "").trim();

  if (normalizedHash.startsWith(`${SCRYPT_PREFIX}$`)) {
    const [, , saltValue, hashValue] = normalizedHash.split("$");

    if (!saltValue || !hashValue) {
      return { valid: false, needsUpgrade: false };
    }

    try {
      const salt = Buffer.from(saltValue, "base64url");
      const expectedHash = Buffer.from(hashValue, "base64url");
      const derivedKey = (await scrypt(
        password,
        salt,
        expectedHash.length,
      )) as Buffer;

      return {
        valid: safeCompare(derivedKey, expectedHash),
        needsUpgrade: false,
      };
    } catch {
      return { valid: false, needsUpgrade: false };
    }
  }

  // Keep existing SHA-256 accounts usable, then upgrade them after login.
  if (/^[a-f0-9]{64}$/i.test(normalizedHash)) {
    const legacyHash = createHash("sha256").update(password).digest("hex");
    const valid = safeCompare(
      Buffer.from(legacyHash, "hex"),
      Buffer.from(normalizedHash, "hex"),
    );

    return { valid, needsUpgrade: valid };
  }

  return { valid: false, needsUpgrade: false };
}
