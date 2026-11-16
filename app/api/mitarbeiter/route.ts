import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser, hashPassword } from "../../../lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Nicht angemeldet." },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Keine Berechtigung." },
        { status: 403 }
      );
    }

    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        lastName: "asc",
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Mitarbeiter laden:", error);

    return NextResponse.json(
      { error: "Mitarbeiter konnten nicht geladen werden." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Nicht angemeldet." },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Keine Berechtigung." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");
    const role = body.role || "EMPLOYEE";

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Bitte alle Pflichtfelder ausfüllen." },
        { status: 400 }
      );
    }

    if (
      firstName.length > 100 ||
      lastName.length > 100 ||
      email.length > 254 ||
      phone.length > 40 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: "Bitte gültige Eingaben verwenden." },
        { status: 400 }
      );
    }

    if (password.length < 12 || password.length > 200) {
      return NextResponse.json(
        { error: "Das Passwort muss 12 bis 200 Zeichen lang sein." },
        { status: 400 }
      );
    }

    if (!["EMPLOYEE", "MANAGEMENT"].includes(role)) {
      return NextResponse.json(
        { error: "Ungültige Mitarbeiterrolle." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const employee = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        employee: {
          create: {
            firstName,
            lastName,
            phone: phone || null,
          },
        },
      },
      include: {
        employee: true,
      },
    });

    return NextResponse.json(
      {
        id: employee.employee?.id,
        firstName: employee.employee?.firstName,
        lastName: employee.employee?.lastName,
        email: employee.email,
        phone: employee.employee?.phone,
        role: employee.role,
        active: employee.employee?.active,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Mitarbeiter anlegen:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse ist bereits vergeben." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Mitarbeiter konnte nicht angelegt werden." },
      { status: 500 }
    );
  }
}
