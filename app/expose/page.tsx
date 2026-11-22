"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ExposePage() {
  const router = useRouter();
  const [error, setError] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Kopfbereich */}
        <div className="flex flex-col gap-4">

          {/* Zurück zum Dashboard */}
          <div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
            >
              ← Zurück
            </button>
          </div>

          {/* Überschrift */}
          <div>
            <p className="text-sm font-medium text-blue-600">
              IMMO OFFICE
            </p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Exposé erstellen
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Erstelle professionelle Immobilien-Exposés.
            </p>
          </div>

        </div>

        {/* Inhalt */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Willkommen zur Exposéerstellung
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Hier entsteht dein neues Exposé-Modul.
          </p>
        </div>

      </div>
    </div>
  );
}
