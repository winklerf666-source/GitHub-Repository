"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Anmeldung fehlgeschlagen.");
        return;
      }

      router.replace("/");
      router.refresh();
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
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            IMMO OFFICE
          </h1>
          <p className="mt-2 text-gray-600">
            Bitte melde dich mit deinen Zugangsdaten an.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            E-Mail-Adresse
          </label>
          <input
            type="email"
            required
            maxLength={254}
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3"
            placeholder="name@firma.de"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Passwort
          </label>
          <input
            type="password"
            required
            maxLength={128}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3"
            placeholder="Dein Passwort"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? "Anmeldung läuft ..." : "Anmelden"}
        </button>

        {message && (
          <p className="text-center text-sm text-red-600" role="alert">
            {message}
          </p>
        )}
      </form>
    </main>
  );
}
