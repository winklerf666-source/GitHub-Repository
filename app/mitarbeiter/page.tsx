import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import MitarbeiterClient from "./MitarbeiterClient";

export default async function MitarbeiterPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return <MitarbeiterClient />;
}
