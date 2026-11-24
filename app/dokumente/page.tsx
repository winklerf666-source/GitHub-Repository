import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import DokumenteClient from "./DokumenteClient";

export default async function DokumentePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="p-6">
      <DokumenteClient role={user.role} />
    </main>
  );
}
