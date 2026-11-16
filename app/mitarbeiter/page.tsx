import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";

export default async function MitarbeiterPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">
        Mitarbeiterverwaltung
      </h1>

      <p className="mt-2 text-gray-600">
        Hier können Mitarbeiter und Benutzerkonten verwaltet werden.
      </p>
    </main>
  );
}


