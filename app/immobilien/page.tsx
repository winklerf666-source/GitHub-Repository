"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  createdAt?: string;
  images?: {
    id: string;
    fileName: string;
    contentType: string;
    altText?: string | null;
    sortOrder: number;
  }[];
};

type UserRole = "ADMIN" | "MANAGEMENT" | "EMPLOYEE";

type PropertyForm = {
  title: string;
  propertyType: string;
  status: string;
  street: string;
  postalCode: string;
  city: string;
  price: string;
  livingArea: string;
  rooms: string;
  employee: string;
  description: string;
};

const propertyTypes = [
  "Wohnung",
  "Haus",
  "Gewerbe",
  "Grundstück",
  "Sonstige",
];

const statuses = [
  "Entwurf",
  "Aktiv",
  "Reserviert",
  "Verkauft",
  "Vermietet",
  "Archiviert",
];

const emptyForm: PropertyForm = {
  title: "",
  propertyType: "Wohnung",
  status: "Entwurf",
  street: "",
  postalCode: "",
  city: "",
  price: "",
  livingArea: "",
  rooms: "",
  employee: "",
  description: "",
};

function formatPrice(price?: number | null) {
  if (price == null) return "–";

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

function statusStyle(status: string) {
  switch (status) {
    case "Aktiv":
      return "bg-green-100 text-green-700";
    case "Verkauft":
      return "bg-blue-100 text-blue-700";
    case "Vermietet":
      return "bg-purple-100 text-purple-700";
    case "Reserviert":
      return "bg-amber-100 text-amber-700";
    case "Archiviert":
      return "bg-gray-200 text-gray-600";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getEmployeeName(property: Property) {
  return property.employee || property.employeeName || "Nicht zugewiesen";
}

export default function ImmobilienPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Alle");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyForm>({ ...emptyForm });

  const isManager = role === "ADMIN" || role === "MANAGEMENT";

  async function loadProperties() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/immobilien");

      if (!response.ok) {
        throw new Error("Immobilien konnten nicht geladen werden.");
      }

      const userRole = response.headers.get("X-User-Role");

      if (
        userRole === "ADMIN" ||
        userRole === "MANAGEMENT" ||
        userRole === "EMPLOYEE"
      ) {
        setRole(userRole);
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

  useEffect(() => {
    loadProperties();
  }, []);

  function openNewForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  }

  function openEditForm(property: Property) {
    setEditingId(property.id);

    setForm({
      title: property.title || "",
      propertyType: property.propertyType || "Wohnung",
      status: property.status || "Entwurf",
      street: property.street || "",
      postalCode: property.postalCode || "",
      city: property.city || "",
      price: property.price != null ? String(property.price) : "",
      livingArea:
        property.livingArea != null ? String(property.livingArea) : "",
      rooms: property.rooms != null ? String(property.rooms) : "",
      employee: getEmployeeName(property),
      description: property.description || "",
    });

    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.title.trim()) {
      setError("Bitte gib einen Immobilientitel ein.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/immobilien", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingId ? { id: editingId, ...form } : form
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Die Immobilie konnte nicht gespeichert werden."
        );
      }

      if (editingId) {
        setProperties((current) =>
          current.map((property) =>
            property.id === editingId ? data : property
          )
        );
      } else {
        setProperties((current) => [data, ...current]);
      }

      setForm({ ...emptyForm });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Beim Speichern ist ein Fehler aufgetreten."
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(property: Property, newStatus: string) {
    try {
      setError("");

      const response = await fetch("/api/immobilien", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: property.id,
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Der Status konnte nicht geändert werden."
        );
      }

      setProperties((current) =>
        current.map((item) =>
          item.id === property.id ? data : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Der Status konnte nicht geändert werden."
      );
      await loadProperties();
    }
  }

  async function deleteProperty(property: Property) {
    const confirmed = window.confirm(
      `Möchtest du die Immobilie "${property.title}" wirklich löschen?`
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch("/api/immobilien", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: property.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Die Immobilie konnte nicht gelöscht werden."
        );
      }

      setProperties((current) =>
        current.filter((item) => item.id !== property.id)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Beim Löschen ist ein Fehler aufgetreten."
      );
    }
  }

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const searchText = search.toLowerCase();

      const matchesSearch = [
        property.title,
        property.street,
        property.postalCode,
        property.city,
        getEmployeeName(property),
        property.propertyType,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(searchText)
        );

      const matchesStatus =
        filterStatus === "Alle" || property.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [properties, search, filterStatus]);

  const activeCount = properties.filter(
    (property) => property.status === "Aktiv"
  ).length;

  const soldCount = properties.filter(
    (property) => property.status === "Verkauft"
  ).length;

  const rentedCount = properties.filter(
    (property) => property.status === "Vermietet"
  ).length;

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

       
        {/* Kopfbereich */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              IMMO OFFICE
            </p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Immobilien
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Verwalte deine Immobilien und behalte den Überblick.
            </p>
            {role && (
              <p className="mt-2 text-xs text-gray-400">
                Angemeldet als: {role}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {showForm ? (
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm({ ...emptyForm });
                  setError("");
                }}
                className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                ← Zurück
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  ← Zurück
                </button>

                <button
                  type="button"
                  onClick={openNewForm}
                  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  + Immobilie hinzufügen
                </button>
              </>
            )}
          </div>
        </div>

        {/* Fehlermeldung */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Kennzahlen */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Immobilien gesamt</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {properties.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Aktiv</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Verkauft</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {soldCount}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Vermietet</p>
            <p className="mt-2 text-3xl font-bold text-purple-600">
              {rentedCount}
            </p>
          </div>
        </div>

        {/* Formular zum Anlegen und Bearbeiten */}
        {showForm && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
            <h2 className="mb-6 text-xl font-bold text-gray-900">
              {editingId ? "Immobilie bearbeiten" : "Neue Immobilie anlegen"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Immobilienname *
                  </label>
                  <input
                    className={inputClass}
                    placeholder="z. B. Moderne 3-Zimmer-Wohnung"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Immobilientyp
                  </label>
                  <select
                    className={inputClass}
                    value={form.propertyType}
                    onChange={(e) =>
                      setForm({ ...form, propertyType: e.target.value })
                    }
                  >
                    {propertyTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    className={inputClass}
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <p className="mb-2 text-sm font-semibold text-gray-800">
                    Adresse
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Straße und Hausnummer
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Musterstraße 12"
                    value={form.street}
                    onChange={(e) =>
                      setForm({ ...form, street: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Postleitzahl
                  </label>
                  <input
                    className={inputClass}
                    placeholder="70173"
                    value={form.postalCode}
                    onChange={(e) =>
                      setForm({ ...form, postalCode: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Ort
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Stuttgart"
                    value={form.city}
                    onChange={(e) =>
                      setForm({ ...form, city: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <p className="mb-2 text-sm font-semibold text-gray-800">
                    Objektdaten
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Preis in Euro
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    placeholder="350000"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Wohnfläche in m²
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    placeholder="95"
                    value={form.livingArea}
                    onChange={(e) =>
                      setForm({ ...form, livingArea: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Zimmer
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className={inputClass}
                    placeholder="3.5"
                    value={form.rooms}
                    onChange={(e) =>
                      setForm({ ...form, rooms: e.target.value })
                    }
                  />
                </div>

                {isManager && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Zuständiger Mitarbeiter
                    </label>
                    <input
                      className={inputClass}
                      placeholder="Name des Mitarbeiters"
                      value={form.employee}
                      onChange={(e) =>
                        setForm({ ...form, employee: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Beschreibung
                  </label>
                  <textarea
                    rows={4}
                    className={inputClass}
                    placeholder="Weitere Informationen zur Immobilie ..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-100 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm({ ...emptyForm });
                    setError("");
                  }}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Wird gespeichert ..."
                    : editingId
                      ? "Änderungen speichern"
                      : "Immobilie speichern"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Suche und Filter */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row">
          <input
            type="search"
            className={inputClass}
            placeholder="Immobilie, Adresse oder Ort suchen ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className={`${inputClass} md:max-w-56`}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Alle">Alle Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

               {/* Immobilienliste */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Immobilienübersicht
            </h2>
            <span className="text-sm text-gray-500">
              {filteredProperties.length} Einträge
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Immobilien werden geladen ...
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-gray-700">
                Keine Immobilien gefunden
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Lege eine neue Immobilie an oder passe deine Suche an.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Immobilie</th>
                    <th className="px-5 py-4 font-semibold">Typ</th>
                    <th className="px-5 py-4 font-semibold">Standort</th>
                    <th className="px-5 py-4 font-semibold">Preis</th>
                    <th className="px-5 py-4 font-semibold">Fläche</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Mitarbeiter</th>
                    <th className="px-5 py-4 font-semibold">Aktionen</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredProperties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {property.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {property.street || "Keine Straße angegeben"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {property.propertyType}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {[property.postalCode, property.city].filter(Boolean).join(" ") || "–"}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {formatPrice(property.price)}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {property.livingArea != null ? `${property.livingArea} m²` : "–"}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          aria-label={`Status von ${property.title} ändern`}
                          className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none ${statusStyle(property.status)}`}
                          value={property.status}
                          onChange={(e) => changeStatus(property, e.target.value)}
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {getEmployeeName(property)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditForm(property)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                          >
                            Bearbeiten
                          </button>
                          {isManager && (
                            <button
                              onClick={() => deleteProperty(property)}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Löschen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
