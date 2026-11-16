"use client";

import { useEffect, useState } from "react";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  active: boolean;
  user: {
    email: string;
    role: "EMPLOYEE" | "MANAGEMENT";
  };
};

export default function MitarbeiterClient() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"EMPLOYEE" | "MANAGEMENT">("EMPLOYEE");

  async function loadEmployees() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/mitarbeiter");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Mitarbeiter konnten nicht geladen werden.");
      }

      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  async function createEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/mitarbeiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Mitarbeiter konnte nicht angelegt werden.");
      }

      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("EMPLOYEE");
      setShowForm(false);

      await loadEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Mitarbeiterverwaltung</h1>
            <p className="mt-2 text-gray-600">
              Mitarbeiter und Benutzerkonten verwalten
            </p>
          </div>

          <button
            onClick={() => {
              setError("");
              setShowForm(!showForm);
            }}
            className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
          >
            {showForm ? "← Zurück" : "+ Mitarbeiter hinzufügen"}
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={createEmployee}
            className="mb-8 rounded-xl bg-white p-6 shadow-sm"
          >
            <h2 className="mb-5 text-xl font-bold">Neuen Mitarbeiter anlegen</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Vorname *</span>
                <input
                  required
                  maxLength={100}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Nachname *</span>
                <input
                  required
                  maxLength={100}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">E-Mail *</span>
                <input
                  required
                  type="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Telefon</span>
                <input
                  maxLength={40}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Passwort *</span>
                <input
                  required
                  type="password"
                  minLength={12}
                  maxLength={200}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
                <span className="mt-1 block text-xs text-gray-500">
                  Mindestens 12 Zeichen.
                </span>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Rolle</span>
                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as "EMPLOYEE" | "MANAGEMENT")
                  }
                  className="w-full rounded-lg border bg-white p-3"
                >
                  <option value="EMPLOYEE">Mitarbeiter</option>
                  <option value="MANAGEMENT">Management</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Wird gespeichert..." : "Mitarbeiter speichern"}
            </button>
          </form>
        )}

        {!showForm && (
          <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">
            Mitarbeiter ({employees.length})
          </h2>

          {loading ? (
            <p className="text-gray-500">Mitarbeiter werden geladen...</p>
          ) : employees.length === 0 ? (
            <p className="text-gray-500">
              Noch keine Mitarbeiter vorhanden. Lege den ersten Mitarbeiter an.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="p-3">Name</th>
                    <th className="p-3">E-Mail</th>
                    <th className="p-3">Telefon</th>
                    <th className="p-3">Rolle</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">
                        {employee.firstName} {employee.lastName}
                      </td>
                      <td className="p-3">{employee.user.email}</td>
                      <td className="p-3">{employee.phone || "–"}</td>
                      <td className="p-3">
                        {employee.user.role === "MANAGEMENT"
                          ? "Management"
                          : "Mitarbeiter"}
                      </td>
                      <td className="p-3">
                        {employee.active ? "Aktiv" : "Inaktiv"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </section>
        )}
      </div>
    </main>
  );
}
