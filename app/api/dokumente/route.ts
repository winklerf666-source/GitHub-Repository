import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import { uploadFile, deleteFile } from "../../../lib/storage";

function isManager(role: string) {
  return role === "ADMIN" || role === "MANAGEMENT";
}

async function getEmployee(userId: string) {
  return prisma.employee.findUnique({
    where: { userId },
  });
}

const allowedExtensions = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "docx",
  "xlsx",
  "txt",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    let where = {};

    if (!isManager(user.role)) {
      const employee = await getEmployee(user.id);

      if (!employee) {
        return NextResponse.json(
          { error: "Mitarbeiter nicht gefunden" },
          { status: 403 }
        );
      }

      where = {
        OR: [
          { property: { employeeId: employee.id } },
          { contact: { employeeId: employee.id } },
        ],
      };
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Fehler beim Laden der Dokumente:", error);

    return NextResponse.json(
      { error: "Dokumente konnten nicht geladen werden" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let storageKey: string | null = null;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const propertyId = String(formData.get("propertyId") || "").trim() || null;
    const contactId = String(formData.get("contactId") || "").trim() || null;

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Bitte eine Datei auswählen" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Die Datei ist leer" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Die Datei darf maximal 20 MB groß sein" },
        { status: 400 }
      );
    }

    if (propertyId && contactId) {
      return NextResponse.json(
        { error: "Bitte entweder eine Immobilie oder einen Kontakt auswählen" },
        { status: 400 }
      );
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "";

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: "Dieser Dateityp ist nicht erlaubt" },
        { status: 400 }
      );
    }

    const manager = isManager(user.role);
    const employee = manager ? null : await getEmployee(user.id);

    if (!manager && !employee) {
      return NextResponse.json(
        { error: "Mitarbeiter nicht gefunden" },
        { status: 403 }
      );
    }

    if (!manager && !propertyId && !contactId) {
      return NextResponse.json(
        { error: "Bitte eine Immobilie oder einen Kontakt zuordnen" },
        { status: 400 }
      );
    }

    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true, employeeId: true },
      });

      if (!property) {
        return NextResponse.json(
          { error: "Immobilie nicht gefunden" },
          { status: 404 }
        );
      }

      if (!manager && property.employeeId !== employee!.id) {
        return NextResponse.json(
          { error: "Keine Berechtigung für diese Immobilie" },
          { status: 403 }
        );
      }
    }

    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { id: true, employeeId: true },
      });

      if (!contact) {
        return NextResponse.json(
          { error: "Kontakt nicht gefunden" },
          { status: 404 }
        );
      }

      if (!manager && contact.employeeId !== employee!.id) {
        return NextResponse.json(
          { error: "Keine Berechtigung für diesen Kontakt" },
          { status: 403 }
        );
      }
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    storageKey = `documents/${randomUUID()}-${safeFileName}`;

    const contentType = file.type || "application/octet-stream";
    const body = new Uint8Array(await file.arrayBuffer());

    await uploadFile({
      key: storageKey,
      body,
      contentType,
    });

    try {
      const document = await prisma.document.create({
        data: {
          fileName: file.name,
          storageKey,
          contentType,
          size: file.size,
          propertyId,
          contactId,
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
            },
          },
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return NextResponse.json(document, { status: 201 });
    } catch (databaseError) {
      await deleteFile(storageKey);
      storageKey = null;
      throw databaseError;
    }
  } catch (error) {
    console.error("Fehler beim Hochladen des Dokuments:", error);

    if (storageKey) {
      try {
        await deleteFile(storageKey);
      } catch (cleanupError) {
        console.error("Fehler beim Aufräumen der Datei:", cleanupError);
      }
    }

    return NextResponse.json(
      { error: "Dokument konnte nicht hochgeladen werden" },
      { status: 500 }
    );
  }
}
