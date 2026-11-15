import { NextResponse } from "next/server";
import { ContactType } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";

const typeToDatabase: Record<string, ContactType> = {
  Käufer: "BUYER",
  Verkäufer: "SELLER",
  Vermieter: "LANDLORD",
  Mieter: "TENANT",
  Sonstige: "OTHER",
};

const typeToDisplay: Record<ContactType, string> = {
  BUYER: "Käufer",
  SELLER: "Verkäufer",
  LANDLORD: "Vermieter",
  TENANT: "Mieter",
  OTHER: "Sonstige",
};

function formatContact(contact: {
  id: string;
  firstName: string;
  lastName: string;
  type: ContactType;
  email: string | null;
  phone: string | null;
  employeeName: string;
  notes: string | null;
}) {
  return {
    ...contact,
    type: typeToDisplay[contact.type],
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    employee: contact.employeeName,
    notes: contact.notes ?? "",
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Bitte zuerst anmelden." },
        { status: 401 }
      );
    }

    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contacts.map(formatContact));
  } catch (error) {
    console.error("Fehler beim Laden der Kontakte:", error);
    return NextResponse.json(
      { error: "Kontakte konnten nicht geladen werden." },
      { status: 500 }
    );
  }
}

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

    if (
      !body.firstName?.trim() ||
      !body.lastName?.trim() ||
      !typeToDatabase[body.type]
    ) {
      return NextResponse.json(
        { error: "Vorname, Nachname und Kontaktart sind erforderlich." },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        type: typeToDatabase[body.type],
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        notes: body.notes?.trim() || null,
        employeeName: body.employee?.trim() || "Nicht zugewiesen",
      },
    });

    return NextResponse.json(formatContact(contact), {
      status: 201,
    });
  } catch (error) {
    console.error("Fehler beim Speichern des Kontakts:", error);
    return NextResponse.json(
      { error: "Kontakt konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }
}
