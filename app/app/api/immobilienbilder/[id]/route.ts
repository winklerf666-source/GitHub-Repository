
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";
import { downloadFile } from "../../../../lib/storage";

export const runtime = "nodejs";

const isManager = (role: string) =>
  role === "ADMIN" || role === "MANAGEMENT";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Bitte zuerst anmelden." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const image = await prisma.propertyImage.findUnique({
      where: { id },
      include: {
        property: {
          select: { employeeId: true },
        },
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: "Immobilienbild nicht gefunden." },
        { status: 404 }
      );
    }

    if (!isManager(user.role)) {
      const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (
        !employee ||
        image.property.employeeId !== employee.id
      ) {
        return NextResponse.json(
          { error: "Kein Zugriff auf dieses Bild." },
          { status: 403 }
        );
      }
    }

    const file = await downloadFile(image.storageKey);
    const contentType = image.contentType || file.contentType;

    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Die Datei ist kein gültiges Bild." },
        { status: 415 }
      );
    }

    return new Response(new Uint8Array(file.body), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox",
      },
    });
  } catch (error) {
    console.error("Fehler beim Laden des Immobilienbildes:", error);

    return NextResponse.json(
      { error: "Immobilienbild konnte nicht geladen werden." },
      { status: 500 }
    );
  }
}
