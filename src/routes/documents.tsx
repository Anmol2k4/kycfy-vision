import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  IdCard,
  CreditCard,
  BookUser,
  CarFront,
  UploadCloud,
  FileCheck2,
  Loader2,
  Info,
  Eye,
  Download,
} from "lucide-react";
import { PageHeader, Card } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { api, documentUrl, getToken } from "@/lib/api";
import type { Application } from "@/lib/types";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — KYCFlow AI" },
      {
        name: "description",
        content: "Upload and review identity documents attached to KYC applications.",
      },
    ],
  }),
  component: DocumentsPage,
});

type DocumentRecord = {
  id: number;
  applicationId: string;
  type: string;
  fileName: string;
  size: string;
  status: string;
  contentType: string;
  createdAt: string;
};
const DOC_TYPES = [
  {
    key: "Aadhaar Card",
    title: "Aadhaar Card",
    description: "UIDAI-issued identity proof",
    icon: IdCard,
  },
  { key: "PAN Card", title: "PAN Card", description: "Permanent account number", icon: CreditCard },
  {
    key: "Passport",
    title: "Passport",
    description: "Travel and identity document",
    icon: BookUser,
  },
  {
    key: "Driving Licence",
    title: "Driving Licence",
    description: "RTO-issued identity document",
    icon: CarFront,
  },
];

function DocumentsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyType, setBusyType] = useState("");
  const [dragging, setDragging] = useState("");
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    api<Application[]>("/applications")
      .then((items) => {
        setApplications(items);
        setApplicationId(items[0]?.id ?? "");
      })
      .catch((cause) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);
  const loadDocuments = useCallback(() => {
    if (!applicationId) {
      setDocuments([]);
      return;
    }
    api<DocumentRecord[]>(`/documents?application_id=${encodeURIComponent(applicationId)}`)
      .then(setDocuments)
      .catch((cause) => setError(cause.message));
  }, [applicationId]);
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const upload = async (type: string, file?: File) => {
    if (!file || !applicationId) return;
    setError("");
    if (
      !/[.](pdf|jpe?g|png)$/i.test(file.name) ||
      !["application/pdf", "image/jpeg", "image/png"].includes(file.type)
    ) {
      setError("Choose a PDF, JPG, JPEG, or PNG file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Files must be 10 MB or smaller.");
      return;
    }
    setBusyType(type);
    const form = new FormData();
    form.append("file", file);
    try {
      const doc = await api<DocumentRecord>(
        `/applications/${encodeURIComponent(applicationId)}/documents?document_type=${encodeURIComponent(type)}`,
        { method: "POST", body: form },
      );
      setDocuments((items) => [doc, ...items]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setBusyType("");
    }
  };
  const openDocument = async (doc: DocumentRecord, download: boolean) => {
    try {
      const response = await fetch(documentUrl(doc.id), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error("Unable to open this document.");
      const url = URL.createObjectURL(await response.blob());
      if (download) {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = doc.fileName;
        anchor.click();
      } else window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open document.");
    }
  };
  const onDrop = (event: DragEvent, type: string) => {
    event.preventDefault();
    setDragging("");
    void upload(type, event.dataTransfer.files[0]);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title="Documents"
        description="Upload identity documents and review extracted information"
      />
      <Card className="mb-5 flex flex-wrap items-center gap-3 p-4">
        <label htmlFor="document-application" className="text-sm font-semibold">
          Application
        </label>
        <select
          id="document-application"
          value={applicationId}
          onChange={(event) => setApplicationId(event.target.value)}
          className="h-10 min-w-64 rounded-lg border bg-background px-3 text-sm"
          disabled={!applications.length}
        >
          <option value="">Select an application</option>
          {applications.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id} — {item.name}
            </option>
          ))}
        </select>
        {loading && <span className="text-sm text-muted-foreground">Loading applications…</span>}
        {!loading && !applications.length && (
          <span className="text-sm text-muted-foreground">
            Create an application before uploading documents.
          </span>
        )}
      </Card>
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-info/20 bg-info-soft px-4 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-info" />
        <p className="text-xs leading-relaxed text-info">
          Files are stored on the configured backend disk. Text PDFs are parsed locally; image-only
          or unreadable documents are marked for manual review. No OCR or authenticity service is
          claimed.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-destructive-soft p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DOC_TYPES.map((doc) => {
          const Icon = doc.icon;
          const record = documents.find((item) => item.type === doc.key);
          const busy = busyType === doc.key;
          return (
            <Card key={doc.key} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">{doc.title}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">{doc.description}</p>
                  </div>
                </div>
                {record && <StatusBadge status={record.status} />}
              </div>
              <div
                role="button"
                tabIndex={0}
                aria-label={`Upload ${doc.title}`}
                onClick={() => applicationId && inputs.current[doc.key]?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && applicationId) inputs.current[doc.key]?.click();
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(doc.key);
                }}
                onDragLeave={() => setDragging("")}
                onDrop={(event) => onDrop(event, doc.key)}
                className={cn(
                  "mt-4 flex min-h-44 flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
                  dragging === doc.key
                    ? "border-primary bg-primary-soft/50"
                    : "border-border bg-muted/40 hover:border-primary/50 hover:bg-muted",
                  (!applicationId || busy) && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  ref={(node) => {
                    inputs.current[doc.key] = node;
                  }}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  disabled={!applicationId || busy}
                  onChange={(event) => {
                    void upload(doc.key, event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                {busy ? (
                  <>
                    <Loader2 className="size-7 animate-spin text-primary" />
                    <p className="mt-2 text-sm font-semibold">Uploading and extracting…</p>
                  </>
                ) : record ? (
                  <>
                    <FileCheck2 className="size-7 text-success" />
                    <p className="mt-2 max-w-full truncate text-sm font-semibold">
                      {record.fileName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {record.size} · {record.status}
                    </p>
                    <p className="mt-2 text-xs font-medium text-primary">
                      Drop or browse to add another
                    </p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="size-7 text-muted-foreground" />
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      Drag & drop or <span className="text-primary">browse files</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PDF, JPG or PNG · max 10 MB
                    </p>
                  </>
                )}
              </div>
              {record && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void openDocument(record, false)}
                    className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <Eye className="size-3.5" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => void openDocument(record, true)}
                    className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <Download className="size-3.5" />
                    Download
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {documents.length > 0 && (
        <Card className="mt-5 overflow-hidden">
          <div className="border-b px-5 py-4">
            <h2 className="text-sm font-bold">All uploaded documents</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                  <th className="px-5 py-3">Document</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Uploaded</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-5 py-3">{item.fileName}</td>
                    <td className="px-5 py-3">{item.type}</td>
                    <td className="px-5 py-3">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
