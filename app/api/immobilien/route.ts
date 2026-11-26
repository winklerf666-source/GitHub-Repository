import { NextResponse } from "next/server";
import { PropertyType, PropertyStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";

const typeToDb: Record<string, PropertyType> = {
  Wohnung: "APARTMENT",
  Haus: "HOUSE",
  Gewerbe: "COMMERCIAL",
  Grundstück: "LAND",
  Sonstige: "OTHER",
};

const typeToLabel: Record<PropertyType, string> = {
  APARTMENT: "Wohnung",
  HOUSE: "Haus",
  COMMERCIAL: "Gewerbe",
  LAND: "Grundstück",
  OTHER: "Sonstige",
};

const statusToDb: Record<string, PropertyStatus> = {
  Entwurf: "DRAFT",
  Aktiv: "ACTIVE",
  Reserviert: "RESERVED",
  Verkauft: "SOLD",
  Vermietet: "RENTED",
  Archiviert: "ARCHIVED",
};

const statusToLabel: Record<PropertyStatus, string> = {
  DRAFT: "Entwurf",
  ACTIVE: "Aktiv",
  RESERVED: "Reserviert",
  SOLD: "Verkauft",
  RENTED: "Vermietet",
  ARCHIVED: "Archiviert",
};

const isManager = (role: string) =>
  role === "ADMIN" || role === "MANAGEMENT";

function formatProperty(property: {
  id: string;
  title: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  description: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  price: unknown;
  livingArea: unknown;
  rooms: unknown;
  employeeName: string;
  createdAt: Date;
}) {
  return {
    id: property.id,
    title: property.title,
    propertyType: typeToLabel[property.propertyType],
    status: statusToLabel[property.status],
    description: property.description,
    street: property.street,
    postalCode: property.postalCode,
    city: property.city,
    price: property.price != null ? Number(property.price) : null,
    livingArea:
      property.livingArea != null ? Number(property.livingArea) : null,
    rooms: property.rooms != null ? Number(property.rooms) : null,
    employee: property.employeeName,
    createdAt: property.createdAt,
  };
}

async function getEmployee(userId: string) {
  return prisma.employee.findUnique({
    where: { userId },
  });
}

async function getAccessibleProperty(
  id: string,
  user: { id: string; role: string }
) {
  if (isManager(user.role)) {
    return prisma.property.findUnique({
      where: { id },
    });
  }

  const employee = await getEmployee(user.id);

  if (!employee) {
    return null;
  }

  return prisma.property.findFirst({
    where: {
      id,
      employeeId: employee.id,
    },
  });
}

// Immobilien laden
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Bitte zuerst anmelden." },
        { status: 401 }
      );
    }

    let where = {};

    if (!isManager(user.role)) {
      const employee = await getEmployee(user.id);

      if (!employee) {
        return NextResponse.json(
          { error: "Kein Mitarbeiterkonto gefunden." },
          { status: 403 }
        );
      }

      where = { employeeId: employee.id };
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        images: {
          orderBy: {
            sortOrder: "asc",
          },
          select: {
            id: true,
            fileName: true,
            contentType: true,
            altText: true,
            sortOrder: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(properties.map(formatProperty), {
  headers: {
    "X-User-Role": user.role,
  },
});
  } catch (error) {
    console.error("Fehler beim Laden der Immobilien:", error);

    return NextResponse.json(
      { error: "Immobilien konnten nicht geladen werden." },
      { status: 500 }
    );
  }
}

// Neue Immobilie anlegen
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Bitte zuerst anmelden." },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json(
        { error: "Bitte gib einen Immobilientitel ein." },
        { status: 400 }
      );
    }

    const propertyType = typeToDb[body.propertyType];
    const status = statusToDb[body.status || "Entwurf"];

    if (!propertyType || !status) {
      return NextResponse.json(
        { error: "Immobilientyp oder Status ist ungültig." },
        { status: 400 }
      );
    }

    let employeeId: string | null = null;
    let employeeName = body.employee || "Nicht zugewiesen";

    if (!isManager(user.role)) {
      const employee = await getEmployee(user.id);

      if (!employee) {
        return NextResponse.json(
          { error: "Kein Mitarbeiterkonto gefunden." },
          { status: 403 }
        );
      }

      employeeId = employee.id;
      employeeName = `${employee.firstName} ${employee.lastName}`;
    }

    const property = await prisma.property.create({
      data: {
        title: body.title.trim(),
        propertyType,
        status,
        description: body.description || null,
        street: body.street || null,
        postalCode: body.postalCode || null,
        city: body.city || null,
        price:
          body.price !== "" && body.price != null
            ? String(body.price)
            : null,
        livingArea:
          body.livingArea !== "" && body.livingArea != null
            ? String(body.livingArea)
            : null,
        rooms:
          body.rooms !== "" && body.rooms != null
            ? String(body.rooms)
            : null,
        employeeId,
        employeeName,
      },
    });

    return NextResponse.json(formatProperty(property), {
      status: 201,
    });
  } catch (error) {
    console.error("Fehler beim Speichern der Immobilie:", error);

    return NextResponse.json(
      { error: "Immobilie konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }
}

// Immobilie bearbeiten und Status ändern
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Bitte zuerst anmelden." },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json(
        { error: "Ungültige Immobilien-ID." },
        { status: 400 }
      );
    }

    const existingProperty = await getAccessibleProperty(body.id, user);

    if (!existingProperty) {
      return NextResponse.json(
        { error: "Immobilie nicht gefunden oder keine Berechtigung." },
        { status: 404 }
      );
    }

    const data: {
      title?: string;
      propertyType?: PropertyType;
      status?: PropertyStatus;
      description?: string | null;
      street?: string | null;
      postalCode?: string | null;
      city?: string | null;
      price?: string | null;
      livingArea?: string | null;
      rooms?: string | null;
      employeeName?: string;
    } = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json(
          { error: "Bitte gib einen gültigen Titel ein." },
          { status: 400 }
        );
      }
      data.title = body.title.trim();
    }

    if (body.propertyType !== undefined) {
      const propertyType = typeToDb[body.propertyType];

      if (!propertyType) {
        return NextResponse.json(
          { error: "Immobilientyp ist ungültig." },
          { status: 400 }
        );
      }

      data.propertyType = propertyType;
    }

    if (body.status !== undefined) {
      const status = statusToDb[body.status];

      if (!status) {
        return NextResponse.json(
          { error: "Status ist ungültig." },
          { status: 400 }
        );
      }

      data.status = status;
    }

    if (body.description !== undefined) {
      data.description = body.description || null;
    }

    if (body.street !== undefined) data.street = body.street || null;
    if (body.postalCode !== undefined) {
      data.postalCode = body.postalCode || null;
    }
    if (body.city !== undefined) data.city = body.city || null;

    if (body.price !== undefined) {
      data.price =
        body.price !== "" && body.price != null
          ? String(body.price)
          : null;
    }

    if (body.livingArea !== undefined) {
      data.livingArea =
        body.livingArea !== "" && body.livingArea != null
          ? String(body.livingArea)
          : null;
    }

    if (body.rooms !== undefined) {
      data.rooms =
        body.rooms !== "" && body.rooms != null
          ? String(body.rooms)
          : null;
    }

    // Mitarbeiter dürfen ihre Zuordnung nicht selbst verändern.
    if (isManager(user.role) && body.employee !== undefined) {
      data.employeeName = body.employee || "Nicht zugewiesen";
    }

    const updatedProperty = await prisma.property.update({
      where: { id: body.id },
      data,
    });

    return NextResponse.json(formatProperty(updatedProperty));
  } catch (error) {
    console.error("Fehler beim Bearbeiten der Immobilie:", error);

    return NextResponse.json(
      { error: "Immobilie konnte nicht bearbeitet werden." },
      { status: 500 }
    );
  }
}

// Immobilie löschen – nur ADMIN und MANAGEMENT
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Bitte zuerst anmelden." },
        { status: 401 }
      );
    }

    if (!isManager(user.role)) {
      return NextResponse.json(
        { error: "Du hast keine Berechtigung, Immobilien zu löschen." },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json(
        { error: "Ungültige Immobilien-ID." },
        { status: 400 }
      );
    }

    await prisma.property.delete({
      where: { id: body.id },
    });

    return NextResponse.json({
      success: true,
      message: "Immobilie wurde gelöscht.",
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Immobilie wurde nicht gefunden." },
        { status: 404 }
      );
    }

    console.error("Fehler beim Löschen der Immobilie:", error);

    return NextResponse.json(
      { error: "Immobilie konnte nicht gelöscht werden." },
      { status: 500 }
    );
  }
}
