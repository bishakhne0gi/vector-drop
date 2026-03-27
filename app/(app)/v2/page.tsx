"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { AlertCircle, ImagePlus, X } from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { ConversionProgress } from "@/components/upload/ConversionProgress";
import { URLInput } from "@/components/v2/URLInput";
import { StyleDNACard } from "@/components/v2/StyleDNACard";
import { ComparisonViewer } from "@/components/v2/ComparisonViewer";
import { ProviderToggle } from "@/components/shared/ProviderToggle";
import { useAIProvider } from "@/lib/hooks/useAIProvider";
import { cn } from "@/lib/utils";
import type {
  CreateProjectRequest,
  CreateProjectResponse,
  ConvertProjectResponse,
  JobStatusResponse,
  IconStyleDNA,
  ExtractDNAResponse,
  StyleTransferResponse,
  GenerateFromDNAResponse,
  Project,
  SaveIconRequest,
} from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "convert" | "generate";
type Status =
  | "idle"
  | "uploading"
  | "upload_done"
  | "analysing"
  | "analysis_done"
  | "transferring"
  | "done"
  | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function createAndConvert(
  file: File,
): Promise<{ jobId: string; projectId: string }> {
  const body: CreateProjectRequest = {
    name: file.name.replace(/\.[^.]+$/, ""),
    fileName: file.name,
    mimeType: file.type as CreateProjectRequest["mimeType"],
    fileSizeBytes: file.size,
  };

  const createRes = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!createRes.ok) throw new Error("Failed to create project");
  const { project, uploadUrl } =
    (await createRes.json()) as CreateProjectResponse;

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("Failed to upload image");

  const convertRes = await fetch(`/api/projects/${project.id}/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!convertRes.ok) throw new Error("Failed to start conversion");
  const { jobId } = (await convertRes.json()) as ConvertProjectResponse;

  return { jobId, projectId: project.id };
}

async function fetchProjectSvgContent(projectId: string): Promise<string> {
  const res = await fetch(`/api/projects/${projectId}`);
  if (!res.ok) throw new Error("Failed to fetch project");
  const project = (await res.json()) as Project;
  if (!project.svg_url) throw new Error("SVG not yet available for this project");
  const svgRes = await fetch(project.svg_url);
  if (!svgRes.ok) throw new Error("Failed to fetch SVG content");
  return svgRes.text();
}

const REF_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const REF_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

// ─── Step label sets ──────────────────────────────────────────────────────────

const STEP_LABELS: Record<Mode | "none", string[]> = {
  none:     ["Choose path", "Analyse style", "Action",  "Result"],
  convert:  ["Upload icon",  "Analyse style", "Convert", "Result"],
  generate: ["Upload image", "Analyse style", "Generate","Result"],
};

function stepIndex(status: Status, mode: Mode | null): number {
  if (mode === null) return 0;
  if (status === "idle" || status === "uploading") return 1;
  if (status === "upload_done" || status === "analysing") return 2;
  if (status === "analysis_done" || status === "transferring") return 3;
  if (status === "done") return 4;
  return 1;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function V2Page() {
  // Provider
  const [provider, setProvider] = useAIProvider();

  // Mode
  const [mode, setMode] = useState<Mode | null>(null);

  // Path A — convert
  const [activeJob, setActiveJob] = useState<{ jobId: string; projectId: string } | null>(null);
  const [sourceSvg, setSourceSvg] = useState<string | null>(null);

  // Path B — generate
  const [refImageFile, setRefImageFile] = useState<File | null>(null);
  const [refImagePreview, setRefImagePreview] = useState<string | null>(null);
  const [refImageError, setRefImageError] = useState<string | null>(null);
  const [genPrompt, setGenPrompt] = useState("");
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);

  // Shared
  const [status, setStatus] = useState<Status>("idle");
  const [url, setUrl] = useState("");
  const [dna, setDna] = useState<IconStyleDNA | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [transferredSvg, setTransferredSvg] = useState<string | null>(null);
  const [resultDescription, setResultDescription] = useState("");
  const [savedIconId, setSavedIconId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refInputRef = useRef<HTMLInputElement>(null);
  const [refDragging, setRefDragging] = useState(false);

  // ── Path B — mini drop zone helpers ────────────────────────────────────────

  function acceptRefFile(file: File) {
    if (!REF_ACCEPTED_TYPES.includes(file.type)) {
      setRefImageError("Only JPEG, PNG, or WebP images are accepted.");
      return;
    }
    if (file.size > REF_MAX_BYTES) {
      setRefImageError("Image must be 2 MB or smaller.");
      return;
    }
    setRefImageError(null);
    if (refImagePreview) URL.revokeObjectURL(refImagePreview);
    setRefImageFile(file);
    setRefImagePreview(URL.createObjectURL(file));
  }

  function clearRefImage() {
    if (refImagePreview) URL.revokeObjectURL(refImagePreview);
    setRefImageFile(null);
    setRefImagePreview(null);
    if (refInputRef.current) refInputRef.current.value = "";
  }

  // ── Step 1 (convert): file dropped ─────────────────────────────────────────

  const onFile = useCallback(async (file: File) => {
    setStatus("uploading");
    setErrorMessage(null);
    try {
      const result = await createAndConvert(file);
      setActiveJob(result);
    } catch (err) {
      setStatus("error");
      setErrorMessage((err as Error).message);
    }
  }, []);

  const onConversionDone = useCallback(
    async (_job: JobStatusResponse) => {
      if (!activeJob) return;
      try {
        const svgText = await fetchProjectSvgContent(activeJob.projectId);
        setSourceSvg(svgText);
        setActiveJob(null);
        setStatus("upload_done");
      } catch (err) {
        setStatus("error");
        setErrorMessage((err as Error).message);
      }
    },
    [activeJob],
  );

  const onConversionError = useCallback((message: string) => {
    setActiveJob(null);
    setStatus("error");
    setErrorMessage(message);
  }, []);

  // ── Step 1 (generate): continue ────────────────────────────────────────────

  function handleGenerateContinue() {
    if (refImageFile && genPrompt.trim()) {
      setStatus("upload_done");
    }
  }

  // ── Step 2: analyse URL ─────────────────────────────────────────────────────

  const handleAnalyse = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setUrlError("URL must start with http:// or https://");
      return;
    }
    setUrlError(null);
    setStatus("analysing");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/ai/extract-dna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, provider }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to extract style DNA");
      }
      const data = (await res.json()) as ExtractDNAResponse;
      setDna(data.dna);
      setStatus("analysis_done");
    } catch (err) {
      setStatus("error");
      setErrorMessage((err as Error).message);
    }
  }, [url, provider]);

  // ── Step 3a: style transfer (Path A) ───────────────────────────────────────

  const handleTransfer = useCallback(async () => {
    if (!sourceSvg || !dna) return;
    setStatus("transferring");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/ai/style-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ svgContent: sourceSvg, dnaId: dna.id, provider }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Style transfer failed");
      }
      const data = (await res.json()) as StyleTransferResponse;
      setTransferredSvg(data.svgContent);
      setResultDescription(data.description);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage((err as Error).message);
    }
  }, [sourceSvg, dna, provider]);

  // ── Step 3b: generate icon (Path B) ────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!refImageFile || !genPrompt.trim() || !dna) return;
    setStatus("transferring");
    setErrorMessage(null);
    try {
      const buffer = await refImageFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const imageBase64 = btoa(binary);

      const res = await fetch("/api/ai/generate-from-dna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          imageMimeType: refImageFile.type,
          prompt: genPrompt.trim(),
          dnaId: dna.id,
          provider,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Generation failed");
      }
      const data = (await res.json()) as GenerateFromDNAResponse;
      setGeneratedSvg(data.svgContent);
      setResultDescription(data.description);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage((err as Error).message);
    }
  }, [refImageFile, genPrompt, dna, provider]);

  // ── Download ────────────────────────────────────────────────────────────────

  const handleDownload = useCallback(() => {
    const svg = mode === "generate" ? generatedSvg : transferredSvg;
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = mode === "generate" ? "icon-generated.svg" : "icon-styled.svg";
    a.click();
    URL.revokeObjectURL(objectUrl);
  }, [mode, generatedSvg, transferredSvg]);

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const svg = mode === "generate" ? generatedSvg : transferredSvg;
    if (!svg || !dna) return;
    setIsSaving(true);
    try {
      const body: SaveIconRequest = {
        prompt:
          mode === "generate"
            ? genPrompt
            : `Style transfer to ${dna.libraryName}`,
        description:
          resultDescription ||
          (mode === "generate"
            ? `Icon generated in ${dna.libraryName} style`
            : `Icon redrawn in ${dna.libraryName} style`),
        style: "outline",
        primaryColor: "#171717",
        svgContent: svg,
        pathCount: (svg.match(/<path/g) ?? []).length,
        isPublic: false,
      };
      const res = await fetch("/api/icons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error ?? "Failed to save icon");
      }
      const { icon } = (await res.json()) as { icon: { id: string } };
      setSavedIconId(icon.id);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }, [mode, generatedSvg, transferredSvg, dna, genPrompt, resultDescription]);

  // ── Reset helpers ───────────────────────────────────────────────────────────

  function resetToUpload() {
    setMode(null);
    setStatus("idle");
    setActiveJob(null);
    setSourceSvg(null);
    clearRefImage();
    setGenPrompt("");
    setGeneratedSvg(null);
    setDna(null);
    setUrl("");
    setUrlError(null);
    setTransferredSvg(null);
    setResultDescription("");
    setSavedIconId(null);
    setErrorMessage(null);
  }

  function resetToAnalysis() {
    setStatus("upload_done");
    setDna(null);
    setUrlError(null);
    setTransferredSvg(null);
    setGeneratedSvg(null);
    setResultDescription("");
    setSavedIconId(null);
    setErrorMessage(null);
  }

  function resetToTransfer() {
    setStatus("analysis_done");
    setTransferredSvg(null);
    setGeneratedSvg(null);
    setResultDescription("");
    setSavedIconId(null);
    setErrorMessage(null);
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const currentStep = stepIndex(status, mode);
  const stepLabels = STEP_LABELS[mode ?? "none"];
  const resultSvg = mode === "generate" ? generatedSvg : transferredSvg;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <main className="mx-auto w-full max-w-4xl px-8 py-16">
      {/* Header */}
      <header className="mb-12 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Style Transfer
          </h1>
          <p className="mt-2 text-sm text-foreground/50">
            Redraw any icon — or generate a new one — in the design language of
            a target icon library
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProviderToggle value={provider} onChange={setProvider} />
          <Link
            href="/dashboard"
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
          >
            Dashboard
          </Link>
          <Link
            href="/icons"
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
          >
            Icon Library
          </Link>
        </div>
      </header>

      {/* Step indicators */}
      <ol className="mb-12 flex items-center gap-0">
        {stepLabels.map((label, i) => {
          const stepNumber = i + 1;
          const isDone = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;
          return (
            <li key={label} className="flex items-center">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors duration-200",
                    isDone
                      ? "bg-foreground text-background"
                      : isActive
                        ? "border-2 border-foreground text-foreground"
                        : "border-2 border-border text-foreground/30",
                  )}
                >
                  {stepNumber}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors duration-200",
                    isDone || isActive
                      ? "text-foreground"
                      : "text-foreground/30",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div
                  className={cn(
                    "mx-3 h-px w-8 transition-colors duration-200",
                    isDone ? "bg-foreground/40" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-10">

        {/* ── STEP 0: Path selection (mode === null) ─────────────────────── */}
        {mode === null && (
          <section>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-foreground/40">
              Step 1 — Choose a path
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Convert card */}
              <button
                type="button"
                onClick={() => setMode("convert")}
                className={cn(
                  "group flex flex-col gap-4 rounded-2xl border-2 border-border bg-background p-6 text-left",
                  "transition-all duration-150 hover:border-foreground/30 hover:bg-foreground/[0.02]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/[0.06]">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-5 w-5 text-foreground/60"
                    aria-hidden="true"
                  >
                    <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Convert icon
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-foreground/50">
                    Upload an existing icon and redraw it in a new style.
                  </p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-foreground/40 transition-colors duration-150 group-hover:text-foreground/70">
                  Select
                  <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3" aria-hidden="true">
                    <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              {/* Generate card */}
              <button
                type="button"
                onClick={() => setMode("generate")}
                className={cn(
                  "group flex flex-col gap-4 rounded-2xl border-2 border-border bg-background p-6 text-left",
                  "transition-all duration-150 hover:border-foreground/30 hover:bg-foreground/[0.02]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/[0.06]">
                  <ImagePlus className="h-5 w-5 text-foreground/60" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Generate from image
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-foreground/50">
                    Upload any photo or screenshot and describe the icon you
                    want to create.
                  </p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-foreground/40 transition-colors duration-150 group-hover:text-foreground/70">
                  Select
                  <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3" aria-hidden="true">
                    <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </div>
          </section>
        )}

        {/* ── STEP 1: Upload (shown after mode is chosen) ────────────────── */}
        {mode !== null && (
          <section>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-foreground/40">
              Step 1 —{" "}
              {mode === "convert"
                ? "Upload your icon"
                : "Upload a reference image"}
            </h2>

            {/* ── Path A: convert ── */}
            {mode === "convert" && (
              <>
                {status === "idle" && (
                  <DropZone onFile={onFile} disabled={false} />
                )}

                {status === "uploading" && activeJob && (
                  <ConversionProgress
                    jobId={activeJob.jobId}
                    onDone={onConversionDone}
                    onError={onConversionError}
                  />
                )}

                {status !== "idle" && status !== "uploading" && (
                  <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-6 py-4">
                    <span className="text-sm text-foreground/70">
                      Icon uploaded and converted to SVG
                    </span>
                    <button
                      type="button"
                      onClick={resetToUpload}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
                    >
                      Change
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── Path B: generate ── */}
            {mode === "generate" && status === "idle" && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-5">
                  {/* Mini drop zone */}
                  <div className="flex flex-col gap-2">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Drop reference image or click to browse"
                      onDrop={(e) => {
                        e.preventDefault();
                        setRefDragging(false);
                        const file = e.dataTransfer.files[0];
                        if (file) acceptRefFile(file);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setRefDragging(true);
                      }}
                      onDragLeave={() => setRefDragging(false)}
                      onClick={() => refInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          refInputRef.current?.click();
                      }}
                      className={cn(
                        "relative flex aspect-square w-full cursor-pointer select-none flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed transition-colors duration-150",
                        refDragging
                          ? "border-foreground/40 bg-foreground/[0.04]"
                          : "border-border bg-foreground/[0.02] hover:border-foreground/20 hover:bg-foreground/[0.03]",
                      )}
                    >
                      {refImagePreview ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={refImagePreview}
                            alt="Reference"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            aria-label="Remove image"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearRefImage();
                            }}
                            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-foreground/60 backdrop-blur-sm transition-opacity hover:opacity-70"
                          >
                            <X className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-4 text-center">
                          <ImagePlus
                            className="h-5 w-5 text-foreground/30"
                            aria-hidden="true"
                          />
                          <span className="text-xs text-foreground/40">
                            Drop image here
                            <br />
                            or click to browse
                          </span>
                          <span className="text-[10px] text-foreground/25">
                            JPEG · PNG · WebP · max 2 MB
                          </span>
                        </div>
                      )}
                    </div>
                    <input
                      ref={refInputRef}
                      type="file"
                      accept={REF_ACCEPTED_TYPES.join(",")}
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden="true"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) acceptRefFile(file);
                      }}
                    />
                    {refImageError && (
                      <p
                        role="alert"
                        className="text-xs text-destructive"
                      >
                        {refImageError}
                      </p>
                    )}
                  </div>

                  {/* Prompt */}
                  <div className="flex flex-col justify-center gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="gen-prompt"
                        className="text-xs font-medium text-foreground/60"
                      >
                        What should the icon show?
                      </label>
                      <input
                        id="gen-prompt"
                        type="text"
                        value={genPrompt}
                        onChange={(e) => setGenPrompt(e.target.value)}
                        placeholder="e.g. crocodile, mountain, coffee cup"
                        maxLength={200}
                        className={cn(
                          "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/30",
                          "focus:outline-none focus:ring-2 focus:ring-foreground/20",
                          "transition-colors duration-150",
                        )}
                      />
                      <span className="text-[10px] text-foreground/30">
                        One word or short phrase
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateContinue}
                      disabled={!refImageFile || !genPrompt.trim()}
                      className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Path B: confirmed state */}
            {mode === "generate" && status !== "idle" && (
              <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-6 py-4">
                <span className="text-sm text-foreground/70">
                  Reference image and prompt ready
                  {genPrompt && (
                    <span className="ml-2 rounded-full bg-foreground/[0.08] px-2 py-0.5 text-xs text-foreground/60">
                      &ldquo;{genPrompt}&rdquo;
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={resetToUpload}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
                >
                  Change
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── STEP 2: URL + DNA (identical for both paths) ──────────────── */}
        <section
          className={cn(
            "transition-opacity duration-300",
            mode === null || status === "idle" || status === "uploading"
              ? "pointer-events-none opacity-0"
              : "opacity-100",
          )}
          aria-hidden={
            mode === null || status === "idle" || status === "uploading"
          }
        >
          <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-foreground/40">
            Step 2 — Target library URL
          </h2>

          <URLInput
            value={url}
            onChange={setUrl}
            onAnalyse={handleAnalyse}
            isLoading={status === "analysing"}
            disabled={
              status !== "upload_done" &&
              status !== "analysis_done" &&
              status !== "error"
            }
            error={urlError}
          />

          {dna && (
            <div className="mt-4">
              <StyleDNACard dna={dna} />
            </div>
          )}
        </section>

        {/* ── STEP 3: Action button (differs by mode) ───────────────────── */}
        <section
          className={cn(
            "transition-opacity duration-300",
            status === "analysis_done" ||
              status === "transferring" ||
              status === "done"
              ? "opacity-100"
              : "pointer-events-none opacity-0",
          )}
          aria-hidden={
            status !== "analysis_done" &&
            status !== "transferring" &&
            status !== "done"
          }
        >
          {status === "transferring" ? (
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
              <span className="text-sm text-foreground/60">
                {mode === "generate"
                  ? `Generating icon in ${dna?.libraryName ?? "target"} style\u2026`
                  : `Redrawing icon in ${dna?.libraryName ?? "target"} style\u2026`}
              </span>
            </div>
          ) : status !== "done" ? (
            mode === "generate" ? (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!refImageFile || !genPrompt.trim() || !dna}
                className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Generate icon
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTransfer}
                disabled={!sourceSvg || !dna}
                className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Convert to this style
              </button>
            )
          ) : null}
        </section>

        {/* ── STEP 4: Result ────────────────────────────────────────────── */}
        <section
          className={cn(
            "transition-opacity duration-300",
            status === "done" ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-hidden={status !== "done"}
        >
          {status === "done" && resultSvg && dna && (
            <ComparisonViewer
              originalSvg={mode === "convert" ? sourceSvg : null}
              transferredSvg={resultSvg}
              dna={dna}
              onDownload={handleDownload}
              onSave={handleSave}
              isSaving={isSaving}
              savedIconId={savedIconId}
              generatedDescription={
                mode === "generate" ? resultDescription : undefined
              }
            />
          )}
        </section>

        {/* ── Error state ───────────────────────────────────────────────── */}
        {status === "error" && errorMessage && (
          <div
            role="alert"
            className="flex flex-col gap-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-6 py-5"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetToTransfer}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
              >
                {mode === "generate" ? "Try generate again" : "Try transfer again"}
              </button>
              <button
                type="button"
                onClick={resetToAnalysis}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
              >
                Try different URL
              </button>
              <button
                type="button"
                onClick={resetToUpload}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
              >
                Start over
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
