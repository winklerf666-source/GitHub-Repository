export default function Home() {
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
        <p style={{ marginBottom: 0 }}>Ihre Immobilien. Ihr Team. Ihre Übersicht.</p>
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
          {[
            ["Kontakte", "Käufer, Verkäufer und Interessenten"],
            ["Immobilien", "Objekte und Vermarktung verwalten"],
            ["Anfragen", "Neue Anfragen im Blick behalten"],
            ["Aufgaben", "Termine und Wiedervorlagen organisieren"],
            ["Exposés", "Premium- und Online-Exposés"],
            ["Auswertungen", "Vertrieb und Mitarbeiterstatistiken"]
          ].map(([title, description]) => (
            <article key={title} style={{
              background: "white",
              padding: 24,
              borderRadius: 12,
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
            }}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
