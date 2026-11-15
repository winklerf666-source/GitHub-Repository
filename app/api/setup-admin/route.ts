import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "../../../lib/prisma";
import { hashPassword } from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const setupSecret = process.env.SETUP_SECRET;
    const providedSecret = request.headers.get("x-setup-secret") ?? "";

    if (!setupSecret || setupSecret.length < 32) {
      return NextResponse.json(
        { error: "Einrichtung ist nicht konfiguriert." },
        { status: 503 }
      );
    }

    const expected = Buffer.from(setupSecret);
    const provided = Buffer.from(providedSecret);

    if (
      expected.length !== provided.length ||
      !timingSafeEqual(expected, provided)
    ) {
      return NextResponse.json(
        { error: "Nicht autorisiert." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 12 ||
      password.length > 128
    ) {
      return NextResponse.json(
        { error: "Bitte gültige E-Mail und ein Passwort mit 12 bis 128 Zeichen eingeben." },
        { status: 400 }
      );
    }

    const userCount = await prisma.user.count();

    if (userCount > 0) {
      return NextResponse.json(
        { error: "Die Ersteinrichtung ist bereits abgeschlossen." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "ADMIN",
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Admin-Einrichtung fehlgeschlagen:", error);

    return NextResponse.json(
      { error: "Administrator konnte nicht eingerichtet werden." },
      { status: 500 }
    );
  }
}
