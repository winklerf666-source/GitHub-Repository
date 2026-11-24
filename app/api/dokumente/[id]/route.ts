import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";
import { deleteFile } from "../../../../lib/storage";

export const runtime = "nodejs";

const isManager = (role: string) =>
  role === "ADMIN" || role === "MANAGEMENT";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
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

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        property: { select: { employeeId: true } },
        contact: { select: { employeeId: true } },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Dokument nicht gefunden." },
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
        (
          document.property?.employeeId !== employee.id &&
          document.contact?.employeeId !== employee.id
        )
      ) {
        return NextResponse.json(
          { error: "Kein Zugriff auf dieses Dokument." },
          { status: 403 }
        );
      }
    }

    await deleteFile(document.storageKey);

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fehler beim Löschen:", error);

    return NextResponse.json(
      { error: "Dokument konnte nicht gelöscht werden." },
      { status: 500 }
    );
  }
}
