"use client";

import { useState } from "react";

export default function SetupAdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupSecret, setSetupSecret] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/setup-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-setup-secret": setupSecret,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Einrichtung fehlgeschlagen.");
        return;
      }

      setMessage("Administrator erfolgreich erstellt! Du kannst dich jetzt anmelden.");
      setPassword("");
      setSetupSecret("");
    } catch {
      setMessage("Verbindung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-xl bg-white p-8 shadow"
      >
        <h1 className="text-2xl font-bold text-gray-900">
          IMMO OFFICE
        </h1>

        <h2 className="text-lg font-semibold text-gray-700">
          Ersten Administrator einrichten
        </h2>

        <div>
          <label className="mb-1 block text-sm font-medium">
            E-Mail-Adresse
          </label>
          <input
            type="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Passwort (mindestens 12 Zeichen)
          </label>
          <input
            type="password"
            required
            minLength={12}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Einrichtungsgeheimnis (SETUP_SECRET)
          </label>
          <input
            type="password"
            required
            value={setupSecret}
            onChange={(event) => setSetupSecret(event.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Wird eingerichtet ..." : "Administrator erstellen"}
        </button>

        {message && (
          <p className="text-sm text-gray-700" role="status">
            {message}
          </p>
        )}
      </form>
    </main>
  );
}
