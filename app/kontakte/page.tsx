import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import ContactClient from "./ContactClient";

export default async function KontaktePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <ContactClient />;
}
