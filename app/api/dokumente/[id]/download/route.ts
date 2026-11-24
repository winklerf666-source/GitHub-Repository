import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/auth";
import { downloadFile } from "../../../../../lib/storage";

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

    const file = await downloadFile(document.storageKey);

    const safeFileName = document.fileName.replace(
      /[\r\n"\\]/g,
      "_"
    );

    const fallbackFileName = safeFileName.replace(
      /[^\x20-\x7E]/g,
      "_"
    );

    const encodedFileName = encodeURIComponent(document.fileName).replace(
      /['()*]/g,
      (char) =>
        `%${char.charCodeAt(0).toString(16).toUpperCase()}`
    );

    return new Response(new Uint8Array(file.body), {
      headers: {
        "Content-Type": document.contentType || file.contentType,
        "Content-Disposition": `attachment; filename="${fallbackFileName}"; filename*=UTF-8''${encodedFileName}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Fehler beim Herunterladen:", error);

    return NextResponse.json(
      { error: "Dokument konnte nicht heruntergeladen werden." },
      { status: 500 }
    );
  }
}
