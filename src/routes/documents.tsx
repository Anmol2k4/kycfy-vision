import { useRef, useState, type DragEvent } from "react";
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
} from "lucide-react";
import { PageHeader, Card } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — KYCFlow AI" },
      {
        name: "description",
        content:
          "Upload Aadhaar, PAN, Passport and Driving Licence documents and watch AI extraction and verification process them in real time.",
      },
      { property: "og:title", content: "Documents — KYCFlow AI" },
      {
        property: "og:description",
        content:
          "Upload Aadhaar, PAN, Passport and Driving Licence documents and watch AI extraction and verification process them in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocumentsPage,
});

type DocState = "idle" | "uploaded" | "processing" | "verified";

interface DocType {
  key: string;
  title: string;
  description: string;
  icon: typeof IdCard;
  initial: DocState;
  initialFile?: string;
}

const DOC_TYPES: DocType[] = [
  {
    key: "aadhaar",
    title: "Aadhaar Card",
    description: "UIDAI-issued identity proof with 12-digit number",
    icon: IdCard,
    initial: "verified",
    initialFile: "aadhaar_front.pdf",
  },
  {
    key: "pan",
    title: "PAN Card",
    description: "Income Tax Department permanent account number",
    icon: CreditCard,
    initial: "processing",
    initialFile: "pan_card_scan.jpg",
  },
  {
    key: "passport",
    title: "Passport",
    description: "Ministry of External Affairs travel document",
    icon: BookUser,
    initial: "idle",
  },
  {
    key: "licence",
    title: "Driving Licence",
    description: "RTO-issued licence with photo and address",
    icon: CarFront,
    initial: "idle",
  },
];

const STATE_LABEL: Record<DocState, string | null> = {
  idle: null,
  uploaded: "Uploaded",
  processing: "Processing",
  verified: "Verified",
};

function DocumentCard({ doc }: { doc: DocType }) {
  const [state, setState] = useState<DocState>(doc.initial);
  const [fileName, setFileName] = useState<string | null>(doc.initialFile ?? null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<number[]>([]);

  const simulate = (name: string) => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    setFileName(name);
    setState("uploaded");
    timersRef.current.push(window.setTimeout(() => setState("processing"), 900));
    timersRef.current.push(window.setTimeout(() => setState("verified"), 2600));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    simulate(files[0].name);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const busy = state === "uploaded" || state === "processing";
  const label = STATE_LABEL[state];
  const Icon = doc.icon;

  return (
    <Card className="flex flex-col p-5">
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
        {label && <StatusBadge status={label} />}
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${doc.title}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "mt-4 flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors",
          dragging
            ? "border-primary bg-primary-soft/50"
            : "border-border bg-muted/40 hover:border-primary/50 hover:bg-muted",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {state === "idle" && (
          <>
            <UploadCloud className="size-7 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold text-foreground">
              Drag & drop or <span className="text-primary">browse files</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, JPG or PNG · max 5 MB</p>
          </>
        )}

        {busy && (
          <>
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="mt-2 text-sm font-semibold text-foreground">
              {state === "uploaded" ? "Upload complete" : "AI is extracting & validating…"}
            </p>
            <p className="mt-1 max-w-full truncate font-mono text-xs text-muted-foreground">
              {fileName}
            </p>
            <div className="mt-3 h-1.5 w-full max-w-44 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full bg-primary transition-all duration-1000",
                  state === "uploaded" ? "w-1/3" : "w-3/4",
                )}
              />
            </div>
          </>
        )}

        {state === "verified" && (
          <>
            <FileCheck2 className="size-7 text-success" />
            <p className="mt-2 text-sm font-semibold text-foreground">Document verified</p>
            <p className="mt-1 max-w-full truncate font-mono text-xs text-muted-foreground">
              {fileName}
            </p>
            <p className="mt-2 text-xs font-medium text-primary">
              Drop a new file to re-process
            </p>
          </>
        )}
      </div>
    </Card>
  );
}

function DocumentsPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title="Documents"
        description="Upload identity documents — AI extraction and validation run automatically"
      />

      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-info/20 bg-info-soft px-4 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-info" />
        <p className="text-xs leading-relaxed text-info">
          Demo mode — files never leave your browser. Upload, OCR extraction and verification
          are simulated with frontend state for presentation purposes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DOC_TYPES.map((doc) => (
          <DocumentCard key={doc.key} doc={doc} />
        ))}
      </div>
    </div>
  );
}
