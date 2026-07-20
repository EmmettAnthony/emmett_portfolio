import { prisma } from "@/lib/db";
import crypto from "crypto";

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = `nl_${crypto.randomBytes(32).toString("hex")}`;
  const prefix = raw.slice(0, 8);
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, prefix, hash };
}

export async function validateApiKey(rawKey: string): Promise<{ valid: boolean; permissions?: string; keyId?: string }> {
  try {
    const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const key = await prisma.apiKey.findUnique({ where: { keyHash: hash } });
    if (!key) return { valid: false };
    await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
    return { valid: true, permissions: key.permissions, keyId: key.id };
  } catch {
    return { valid: false };
  }
}

export function hasPermission(required: string, actual: string): boolean {
  if (actual === "admin") return true;
  if (required === "read") return actual === "read" || actual === "write";
  if (required === "write") return actual === "write";
  return false;
}
