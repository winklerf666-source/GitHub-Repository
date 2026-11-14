"use client";

import { useMemo, useState } from "react";

type ContactType =
  | "Käufer"
  | "Verkäufer"
  | "Vermieter"
  | "Mieter"
  | "Sonstige";

type Contact = {
  id: number;
  firstName: string;
  lastName: string;
  type: ContactType;
  email: string;
  phone: string;
  employee: string;
  notes: string;
};

const employees = ["Nicht zugewiesen", "Geschäftsführung", "Mitarbeiter 1", "Mitarbeiter 2"];

const initialContacts: Contact[] = [
  {
    id: 1,
    firstName: "Max",
    lastName: "Mustermann",
    type: "Käufer",
    email: "max@example.de",
    phone: "0171 1234567",
    employee: "Mitarbeiter 1",
    notes: "Sucht eine Eigentumswohnung",
  },
  {
    id: 2,
    firstName: "Anna",
    lastName: "Beispiel",
    type: "Verkäufer",
    email: "anna@example.de",
    phone: "0172 7654321",
    employee: "Geschäftsführung",
    notes: "Möchte ein Einfamilienhaus verkaufen",
  },
];

export default function KontaktePage() {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Alle");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    type: "Käufer" as ContactType,
    email: "",
    phone: "",
    employee: "Nicht zugewiesen",
    notes: "",
  });

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const text = `${contact.firstName} ${contact.lastName} ${contact.email} ${contact.phone}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesFilter = filter === "Alle" || contact.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [contacts, search, filter]);

  function addContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newContact: Contact = {
      id: Date.now(),
      ...form,
    };

    setContacts((current) => [newContact, ...current]);
    setForm({
      firstName: "",
      lastName: "",
      type: "Käufer",
      email: "",
      phone: "",
      employee: "Nicht zugewiesen",
      notes: "",
    });
    setShowForm(false);
  }

  const types: ContactType[] = [
    "Käufer",
    "Verkäufer",
    "Vermieter",
    "Mieter",
    "Sonstige",
  ];

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>IMMO OFFICE / CRM</p>
          <h1 style={styles.heading}>Kontakte</h1>
          <p style={styles.subtitle}>
            Kunden, Interessenten und Geschäftspartner verwalten.
          </p>
        </div>
       <button
  type="button"
  style={styles.primaryButton}
  onClick={() => {
    console.log("Kontakt-Button wurde geklickt");
    setShowForm(true);
  }}
>
  + Kontakt anlegen
</button>
      </header>

      <section style={styles.stats}>
        <Stat label="Kontakte gesamt" value={contacts.length} />
        <Stat label="Käufer" value={contacts.filter((c) => c.type === "Käufer").length} />
        <Stat label="Verkäufer" value={contacts.filter((c) => c.type === "Verkäufer").length} />
        <Stat
          label="Nicht zugewiesen"
          value={contacts.filter((c) => c.employee === "Nicht zugewiesen").length}
        />
      </section>

      {showForm && (
        <form onSubmit={addContact} style={styles.form}>
          <h2 style={styles.sectionHeading}>Neuen Kontakt anlegen</h2>

          <div style={styles.formGrid}>
            <Field label="Vorname">
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                style={styles.input}
              />
            </Field>

            <Field label="Nachname">
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                style={styles.input}
              />
            </Field>

            <Field label="Kontaktart">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ContactType })}
                style={styles.input}
              >
                {types.map((type) => <option key={type}>{type}</option>)}
              </select>
            </Field>

            <Field label="E-Mail">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={styles.input}
              />
            </Field>

            <Field label="Telefon">
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={styles.input}
              />
            </Field>

            <Field label="Zuständiger Mitarbeiter">
              <select
                value={form.employee}
                onChange={(e) => setForm({ ...form, employee: e.target.value })}
                style={styles.input}
              >
                {employees.map((employee) => <option key={employee}>{employee}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Notizen">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ ...styles.input, minHeight: 85, resize: "vertical" }}
            />
          </Field>

          <div style={styles.formActions}>
            <button type="button" style={styles.secondaryButton} onClick={() => setShowForm(false)}>
              Abbrechen
            </button>
            <button type="submit" style={styles.primaryButton}>
              Kontakt speichern
            </button>
          </div>
        </form>
      )}

      <section style={styles.panel}>
        <div style={styles.toolbar}>
          <input
            placeholder="Name, E-Mail oder Telefonnummer suchen ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...styles.input, maxWidth: 390 }}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ ...styles.input, maxWidth: 190 }}
          >
            <option>Alle</option>
            {types.map((type) => <option key={type}>{type}</option>)}
          </select>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Kontakt</th>
                <th style={styles.th}>Kontaktart</th>
                <th style={styles.th}>E-Mail / Telefon</th>
                <th style={styles.th}>Zuständig</th>
                <th style={styles.th}>Notizen</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id}>
                  <td style={styles.td}>
                    <strong>{contact.firstName} {contact.lastName}</strong>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.tag}>{contact.type}</span>
                  </td>
                  <td style={styles.td}>
                    <div>{contact.email || "–"}</div>
                    <small style={styles.muted}>{contact.phone || "–"}</small>
                  </td>
                  <td style={styles.td}>{contact.employee}</td>
                  <td style={styles.td}>{contact.notes || "–"}</td>
                </tr>
              ))}
              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...styles.td, textAlign: "center", padding: 30 }}>
                    Keine Kontakte gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p style={styles.footerNote}>
          {filteredContacts.length} von {contacts.length} Kontakten angezeigt
        </p>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.stat}>
      <span style={styles.muted}>{label}</span>
      <strong style={styles.statValue}>{value}</strong>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "40px 5%",
    background: "#f5f7fa",
    color: "#172b4d",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 30,
  },
  eyebrow: { color: "#64748b", fontSize: 12, letterSpacing: 2 },
  heading: { fontSize: 32, margin: "8px 0" },
  subtitle: { color: "#64748b", margin: 0 },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  stat: {
    background: "white",
    padding: 20,
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    border: "1px solid #e2e8f0",
  },
  statValue: { fontSize: 28 },
  muted: { color: "#64748b", fontSize: 13 },
  panel: {
    background: "white",
    padding: 22,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
  },
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 7,
    fontSize: 14,
    background: "white",
    color: "#172b4d",
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 760 },
  th: {
    textAlign: "left",
    padding: 13,
    color: "#64748b",
    fontSize: 12,
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    textAlign: "left",
    padding: 14,
    borderBottom: "1px solid #edf0f4",
    fontSize: 14,
    verticalAlign: "top",
  },
  tag: {
    background: "#eaf1fb",
    color: "#24518a",
    borderRadius: 20,
    padding: "5px 9px",
    fontSize: 12,
  },
  primaryButton: {
    background: "#173f70",
    color: "white",
    border: 0,
    padding: "12px 18px",
    borderRadius: 7,
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryButton: {
    background: "white",
    color: "#334155",
    border: "1px solid #cbd5e1",
    padding: "11px 16px",
    borderRadius: 7,
    cursor: "pointer",
  },
  form: {
    background: "white",
    padding: 24,
    borderRadius: 12,
    border: "1px solid #dbe3ed",
    marginBottom: 24,
  },
  sectionHeading: { marginTop: 0, fontSize: 20 },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 16,
  },
  field: { display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: 600, color: "#475569" },
  formActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 },
  footerNote: { color: "#64748b", fontSize: 12, marginBottom: 0 },
};
