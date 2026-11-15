import { NextResponse } from "next/server";
import { PropertyType, PropertyStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";

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

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { createdAt: "desc" },
    });

    const result = properties.map((property) => ({
      id: property.id,
      title: property.title,
      propertyType: typeToLabel[property.propertyType],
      status: statusToLabel[property.status],
      description: property.description,
      street: property.street,
      postalCode: property.postalCode,
      city: property.city,
      price: property.price ? Number(property.price) : null,
      livingArea: property.livingArea
        ? Number(property.livingArea)
        : null,
      rooms: property.rooms ? Number(property.rooms) : null,
      employee: property.employeeName,
      createdAt: property.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Fehler beim Laden der Immobilien:", error);
    return NextResponse.json(
      { error: "Immobilien konnten nicht geladen werden." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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
        employeeName: body.employee || "Nicht zugewiesen",
      },
    });

    return NextResponse.json(
      {
        id: property.id,
        title: property.title,
        propertyType: typeToLabel[property.propertyType],
        status: statusToLabel[property.status],
        description: property.description,
        street: property.street,
        postalCode: property.postalCode,
        city: property.city,
        price: property.price ? Number(property.price) : null,
        livingArea: property.livingArea
          ? Number(property.livingArea)
          : null,
        rooms: property.rooms ? Number(property.rooms) : null,
        employee: property.employeeName,
        createdAt: property.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Fehler beim Speichern der Immobilie:", error);
    return NextResponse.json(
      { error: "Immobilie konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }
}

