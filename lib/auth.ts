import { cookies } from "next/headers";
import { prisma } from "./prisma";
import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET fehlt oder ist zu kurz.");
  }

  return secret;
}

// Passwort sicher hashen
export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12) {
    throw new Error("Das Passwort muss mindestens 12 Zeichen haben.");
  }

  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `${salt}:${derivedKey.toString("hex")}`;
}

// Passwort überprüfen
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const [salt, hash] = storedHash.split(":");

    if (!salt || !hash || !/^[a-f0-9]{128}$/i.test(hash)) {
      return false;
    }

    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    const storedKey = Buffer.from(hash, "hex");

    return (
      storedKey.length === derivedKey.length &&
      timingSafeEqual(storedKey, derivedKey)
    );
  } catch {
    return false;
  }
}

// Sitzung erstellen
export function createSessionToken(userId: string): string {
  const expiresAt = Date.now() + SESSION_DURATION;

  const payload = Buffer.from(
    JSON.stringify({ userId, expiresAt })
  ).toString("base64url");

  const signature = createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

// Sitzung überprüfen
export function verifySessionToken(
  token: string
): { userId: string } | null {
  try {
    const [payload, signature, extra] = token.split(".");

    if (!payload || !signature || extra !== undefined) {
      return null;
    }

    const expectedSignature = createHmac("sha256", getAuthSecret())
      .update(payload)
      .digest();

    const actualSignature = Buffer.from(signature, "base64url");

    if (
      actualSignature.length !== expectedSignature.length ||
      !timingSafeEqual(actualSignature, expectedSignature)
    ) {
      return null;
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      typeof session.userId !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) {
      return null;
    }

    return { userId: session.userId };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("immo_session")?.value;

  if (!token) {
    return null;
  }

  const session = verifySessionToken(token);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      role: true,
      employee: {
        select: {
          active: true,
        },
      },
    },
  });

  if (!user || (user.employee && !user.employee.active)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}
