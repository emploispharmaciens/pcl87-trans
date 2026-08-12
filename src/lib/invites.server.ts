import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Empreinte du mot de passe d'invitation (salée par le code du lien). */
export function hashInvitePassword(code: string, password: string): string {
  return createHash("sha256").update(`${code}:${password}`, "utf8").digest("hex");
}

export function invitePasswordMatches(code: string, password: string, hash: string): boolean {
  const a = Buffer.from(hashInvitePassword(code, password), "utf8");
  const b = Buffer.from(hash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Code de lien lisible, non devinable. */
export function generateInviteCode(): string {
  return randomBytes(12).toString("base64url");
}
