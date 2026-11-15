import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
import {
  createSessionToken,
  verifyPassword,
} from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Bitte E-Mail und Passwort eingeben." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        passwordHash: true,
        employee: {
          select: {
            active: true,
          },
        },
      },
    });

    if (
      !user ||
      (user.employee && !user.employee.active) ||
      !(await verifyPassword(password, user.passwordHash))
    ) {
      return NextResponse.json(
        { error: "E-Mail oder Passwort ist falsch." },
        { status: 401 }
      );
    }

    const token = createSessionToken(user.id);

    const cookieStore = await cookies();

    cookieStore.set("immo_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login-Fehler:", error);

    return NextResponse.json(
      { error: "Anmeldung momentan nicht möglich." },
      { status: 500 }
    );
  }
}
