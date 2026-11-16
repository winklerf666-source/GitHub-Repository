import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import MitarbeiterClient from "./MitarbeiterClient";

export default async function MitarbeiterPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <main className="p-6">
      <Link
        href="/"
        className="mb-6 inline-block rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
      >
        ← Zurück
      </Link>

      <h1 className="mb-6 text-2xl font-bold">
        Mitarbeiterverwaltung
      </h1>

      <MitarbeiterClient />
    </main>
  );
}
