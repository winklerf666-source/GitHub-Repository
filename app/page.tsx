
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "../lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const modules = [
    ["Kontakte", "Käufer, Verkäufer und Interessenten", "/kontakte"],
    ["Immobilien", "Objekte und Vermarktung verwalten", "/immobilien"],
    ["Anfragen", "Neue Anfragen im Blick behalten", null],
    ["Aufgaben", "Termine und Wiedervorlagen organisieren", null],
    ["Exposés", "Premium- und Online-Exposés", null],
    ["Auswertungen", "Vertrieb und Mitarbeiterstatistiken", null],
    ...(user.role === "ADMIN"
      ? [["Mitarbeiter", "Mitarbeiter und Benutzerkonten verwalten", "/mitarbeiter"] as const]
      : [])
  ] as const;

  return (
    <main style={{
      minHeight: "100vh",
      background: "#f3f5f8",
      fontFamily: "Arial, sans-serif",
      color: "#172033"
    }}>
      <header style={{
        background: "#14243a",
        color: "white",
        padding: "24px 40px"
      }}>
        <h1 style={{ margin: 0 }}>IMMO OFFICE</h1>
        <p style={{ marginBottom: 0 }}>
          Ihre Immobilien. Ihr Team. Ihre Übersicht.
        </p>
      </header>

      <section style={{ padding: 40 }}>
        <h2>Willkommen bei IMMO OFFICE</h2>
        <p>Die zentrale Plattform für Ihre Immobilienvermittlung.</p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
          marginTop: 30
        }}>
          {modules.map(([title, description, href]) => {
            const content = (
              <article style={{
                background: "white",
                padding: 24,
                borderRadius: 12,
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                cursor: href ? "pointer" : "default"
              }}>
                <h3>{title}</h3>
                <p>{description}</p>
                {href && <p style={{ color: "#2563eb" }}>Öffnen →</p>}
              </article>
            );

            return href ? (
              <Link
                key={title}
                href={href}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {content}
              </Link>
            ) : (
              <div key={title}>{content}</div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
