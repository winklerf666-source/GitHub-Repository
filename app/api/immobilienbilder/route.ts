import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import { uploadFile } from "../../../lib/storage";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const isManager = (role: string) =>
  role === "ADMIN" || role === "MANAGEMENT";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Bitte zuerst anmelden." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const propertyId = String(formData.get("propertyId") || "");
    const file = formData.get("file");

    if (!propertyId || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Immobilie und Bilddatei sind erforderlich." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Bitte eine gültige Bilddatei auswählen." },
        { status: 415 }
      );
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Das Bild darf maximal 10 MB groß sein." },
        { status: 413 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        employeeId: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Immobilie nicht gefunden." },
        { status: 404 }
      );
    }

    if (!isManager(user.role)) {
      const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!employee || property.employeeId !== employee.id) {
        return NextResponse.json(
          { error: "Keine Berechtigung für diese Immobilie." },
          { status: 403 }
        );
      }
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const storageKey = `immobilien/${propertyId}/${randomUUID()}.${extension}`;

    await uploadFile({
      key: storageKey,
      body: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    });

    const image = await prisma.propertyImage.create({
      data: {
        propertyId,
        storageKey,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        sortOrder: 0,
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("Fehler beim Hochladen des Immobilienbildes:", error);

    return NextResponse.json(
      { error: "Immobilienbild konnte nicht hochgeladen werden." },
      { status: 500 }
    );
  }
}

