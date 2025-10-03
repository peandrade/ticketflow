import { randomBytes, createHash } from "node:crypto";
import { hash as bcryptHash, compare as bcryptCompare } from "bcryptjs";

export const makeToken = (bytes = 32) =>
  randomBytes(bytes).toString("base64url");

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("base64url");

export const hashPassword = (password: string) => bcryptHash(password, 12);
export const verifyPassword = (password: string, passwordHash: string) =>
  bcryptCompare(password, passwordHash);
