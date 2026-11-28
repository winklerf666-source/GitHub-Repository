"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Property = {
  id: string;
  title: string;
  propertyType: string;
  status: string;
  description?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  price?: number | null;
  livingArea?: number | null;
  rooms?: number | null;
    employee?: string | null;
  employeeName?: string | null;
  images?: {
    id: string;
    fileName: string;
    contentType: string;
    altText?: string | null;
    sortOrder: number;
  }[];
};

function formatPrice(price?: number | null) {
  if (price == null) return "Nicht angegeben";

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ExposePage() {
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProperties() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/immobilien");

        if (!response.ok) {
          throw new Error("Immobilien konnten nicht geladen werden.");
        }

        const data = await response.json();
        setProperties(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ein Fehler ist aufgetreten."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, []);

  const selectedProperty = properties.find(
    (property) => property.id === selectedId
  );

    const printStyles = `
    @media print {
      @page {
        size: A4;
        margin: 15mm;
      }

      body {
        background: white !important;
      }

      body * {
        visibility: hidden;
      }

      .expose-print,
      .expose-print * {
        visibility: visible;
      }

      .expose-print {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
      }

      .print\\:hidden {
        display: none !important;
      }

      img {
        max-width: 100%;
        object-fit: contain !important;
      }
    }
  `;

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <style>{printStyles}</style>
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Kopfbereich */}
        <div className="flex flex-col gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
            >
              ← Zurück
            </button>
          </div>

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

        {/* Immobilienauswahl */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            1. Immobilie auswählen
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Wähle eine bereits angelegte Immobilie aus. Die vorhandenen
            Objektdaten werden automatisch übernommen.
          </p>

          {loading ? (
            <p className="mt-5 text-sm text-gray-500">
              Immobilien werden geladen ...
            </p>
          ) : error ? (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : properties.length === 0 ? (
            <div className="mt-5 rounded-lg bg-gray-50 p-5">
              <p className="font-medium text-gray-800">
                Noch keine Immobilien vorhanden.
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Lege zuerst unter „Immobilien“ ein Objekt an.
              </p>
              <button
                type="button"
                onClick={() => router.push("/immobilien")}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Zur Immobilienverwaltung
              </button>
            </div>
          ) : (
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Vorhandene Immobilie
              </label>

              <select
                className={inputClass}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">Bitte Immobilie auswählen ...</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.title}
                    {property.city ? ` – ${property.city}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Übernommene Objektdaten */}
        {selectedProperty && (
          <div className="expose-print rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        {/* Modernes Exposé-Titelblatt */}
            <div className="mb-8">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm font-bold tracking-widest text-blue-900">
                  IMMO OFFICE
                </p>
                <p className="text-xs font-medium tracking-widest text-gray-400">
                  IMMOBILIENEXPOSÉ
                </p>
              </div>

              {selectedProperty.images?.[0] && (
                <img
                  src={`/api/immobilienbilder/${selectedProperty.images[0].id}`}
                  alt={selectedProperty.title}
                  className="max-h-[430px] w-full rounded-xl bg-gray-50 object-contain"
                />
              )}

              <div className="mt-7">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-800">
                  Exklusiv für Sie
                </p>

                <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                  {selectedProperty.title}
                </h1>

                <p className="mt-3 text-lg text-gray-600">
                  {[
                    selectedProperty.street,
                    selectedProperty.postalCode,
                    selectedProperty.city,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>

              <div className="mt-7 h-1 w-20 rounded-full bg-blue-900" />
            </div>
        
            <button
              type="button"
              onClick={() => window.print()}
              className="mb-5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 print:hidden"
            >
              PDF erstellen / drucken
            </button>
        
            <h2 className="mt-8 border-b border-gray-200 pb-3 text-2xl font-bold tracking-tight text-blue-950">
              Ihre Immobilie im Überblick
            </h2>
            
            <p className="mt-2 text-sm text-gray-500">
              Diese Angaben stammen aus deiner Immobilienverwaltung.
            </p>
                        
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Immobilienname
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedProperty.title}
                </p>
              </div>
            
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Immobilientyp
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedProperty.propertyType}
                </p>
              </div>
            
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Status
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedProperty.status}
                </p>
              </div>
            
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Straße
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedProperty.street || "Nicht angegeben"}
                </p>
              </div>
            
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Postleitzahl und Ort
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {[selectedProperty.postalCode, selectedProperty.city]
                    .filter(Boolean)
                    .join(" ") || "Nicht angegeben"}
                </p>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Kaufpreis
                </p>
                <p className="mt-2 text-xl font-bold text-blue-950">
                  {formatPrice(selectedProperty.price)}
                </p>
              </div>
            
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Wohnfläche
                </p>
                <p className="mt-2 text-xl font-bold text-blue-950">
                  {selectedProperty.livingArea != null
                    ? `${selectedProperty.livingArea} m²`
                    : "Nicht angegeben"}
                </p>
              </div>
            
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Zimmer
                </p>
                <p className="mt-2 text-xl font-bold text-blue-950">
                  {selectedProperty.rooms ?? "Nicht angegeben"}
                </p>
              </div>
            </div>
            
            <div className="mt-6 rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Zuständiger Mitarbeiter
              </p>
              <p className="mt-2 font-semibold text-blue-950">
                {selectedProperty.employee ||
                  selectedProperty.employeeName ||
                  "Nicht zugewiesen"}
              </p>
            </div>
            
            <div className="mt-6 border-t border-gray-100 pt-5">
              <p className="text-xs font-medium uppercase text-gray-400">
                Objektbeschreibung
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {selectedProperty.description || "Keine Beschreibung hinterlegt."}
              </p>
            </div>
                        {/* Immobilienbilder */}
            <div className="mt-6 border-t border-gray-100 pt-5">
              <h3 className="text-lg font-semibold text-gray-900">
                Immobilienbilder
              </h3>

              {selectedProperty.images?.length ? (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {selectedProperty.images.map((image) => (
                    <div
                      key={image.id}
                      className="overflow-hidden rounded-xl border border-gray-200"
                    >
                      <img
                        src={`/api/immobilienbilder/${image.id}`}
                        alt={image.altText || image.fileName}
                        className="h-auto max-h-[500px] w-full object-contain bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  Für diese Immobilie sind noch keine Bilder vorhanden.
                </p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
