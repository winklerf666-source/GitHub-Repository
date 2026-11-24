"use client";

import { useCallback, useEffect, useState } from "react";

type Property = {
  id: string;
  title: string;
};

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
};

type DocumentItem = {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: string;
  property?: Property | null;
  contact?: Contact | null;
};

type Props = {
  role: string;
};

export default function DokumenteClient({ role }: Props) {
  const isManager = role === "ADMIN" || role === "MANAGEMENT";

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const requests = [
        fetch("/api/dokumente"),
        fetch("/api/immobilien"),
      ];

      if (isManager) {
        requests.push(fetch("/api/kontakte"));
      }

      const responses = await Promise.all(requests);

      const documentsData = await responses[0].json();
      const propertiesData = await responses[1].json();

      if (!responses[0].ok) {
        throw new Error(documentsData.error || "Dokumente konnten nicht geladen werden.");
      }

      if (!responses[1].ok) {
        throw new Error(propertiesData.error || "Immobilien konnten nicht geladen werden.");
      }

      setDocuments(documentsData);
      setProperties(propertiesData);

      if (isManager && responses[2]) {
        const contactsData = await responses[2].json();

        if (!responses[2].ok) {
          throw new Error(contactsData.error || "Kontakte konnten nicht geladen werden.");
        }

        setContacts(contactsData);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Fehler beim Laden."
      );
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!file) {
      setError("Bitte zuerst eine Datei auswählen.");
      return;
    }

    if (!isManager && !propertyId && !contactId) {
      setError("Bitte eine Immobilie auswählen.");
      return;
    }

    if (propertyId && contactId) {
      setError("Bitte nur eine Zuordnung auswählen.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    if (propertyId) formData.append("propertyId", propertyId);
    if (contactId) formData.append("contactId", contactId);

    setUploading(true);

    try {
      const response = await fetch("/api/dokumente", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload fehlgeschlagen.");
      }

      setFile(null);
      setPropertyId("");
      setContactId("");

      const input = document.getElementById(
        "document-file"
      ) as HTMLInputElement | null;

      if (input) input.value = "";

      setSuccess("Dokument wurde erfolgreich hochgeladen.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload fehlgeschlagen."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Möchtest du dieses Dokument wirklich löschen?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/dokumente/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Löschen fehlgeschlagen.");
      }

      setSuccess("Dokument wurde gelöscht.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Löschen fehlgeschlagen."
      );
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("de-DE");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Dokumentenverwaltung
        </h1>
        <p className="mt-2 text-gray-600">
          Dokumente zentral hochladen, zuordnen und verwalten.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-semibold text-gray-900">
          Neues Dokument hochladen
        </h2>

        <form onSubmit={handleUpload} className="space-y-5">
          <div>
            <label
              htmlFor="document-file"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Datei auswählen
            </label>

            <input
              id="document-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.txt"
              onChange={(event) =>
                setFile(event.target.files?.[0] || null)
              }
              className="block w-full rounded-lg border border-gray-300 p-3 text-sm"
            />

            <p className="mt-2 text-xs text-gray-500">
              PDF, JPG, PNG, DOCX, XLSX oder TXT – maximal 20 MB.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="property"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Immobilie zuordnen
              </label>

              <select
                id="property"
                value={propertyId}
                onChange={(event) => {
                  setPropertyId(event.target.value);
                  if (event.target.value) setContactId("");
                }}
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm"
              >
                <option value="">Keine Immobilie auswählen</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.title}
                  </option>
                ))}
              </select>
            </div>

            {isManager && (
              <div>
                <label
                  htmlFor="contact"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Kontakt zuordnen
                </label>

                <select
                  id="contact"
                  value={contactId}
                  onChange={(event) => {
                    setContactId(event.target.value);
                    if (event.target.value) setPropertyId("");
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm"
                >
                  <option value="">Keinen Kontakt auswählen</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isManager && (
            <p className="text-xs text-gray-500">
              Als Verwaltung kannst du Dokumente auch ohne Zuordnung hochladen.
            </p>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Wird hochgeladen ..." : "Dokument hochladen"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Gespeicherte Dokumente
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {documents.length} Dokument(e)
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Aktualisieren
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-gray-500">
            Dokumente werden geladen ...
          </p>
        ) : documents.length === 0 ? (
          <p className="rounded-lg bg-gray-50 py-10 text-center text-gray-500">
            Noch keine Dokumente vorhanden.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="px-3 py-3 font-medium">Dateiname</th>
                  <th className="px-3 py-3 font-medium">Zuordnung</th>
                  <th className="px-3 py-3 font-medium">Größe</th>
                  <th className="px-3 py-3 font-medium">Datum</th>
                  <th className="px-3 py-3 text-right font-medium">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody>
                {documents.map((document) => (
                  <tr
                    key={document.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-3 py-4 font-medium text-gray-900">
                      {document.fileName}
                    </td>

                    <td className="px-3 py-4 text-gray-600">
                      {document.property?.title ||
                        (document.contact
                          ? `${document.contact.firstName} ${document.contact.lastName}`
                          : "Keine Zuordnung")}
                    </td>

                    <td className="px-3 py-4 text-gray-600">
                      {formatSize(document.size)}
                    </td>

                    <td className="px-3 py-4 text-gray-600">
                      {formatDate(document.createdAt)}
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-3">
                        <a
                          href={`/api/dokumente/${document.id}/download`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          Download
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDelete(document.id)}
                          className="font-medium text-red-600 hover:text-red-800"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
