// ─── Error Types ────────────────────────────────────────────────────────────

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "PIPELINE_ERROR"
  | "STORAGE_ERROR"
  | "CACHE_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }

  static validation(message: string, context?: Record<string, unknown>): AppError {
    return new AppError("VALIDATION_ERROR", message, 400, context);
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError("FORBIDDEN", message, 403);
  }

  static notFound(resource: string): AppError {
    return new AppError("NOT_FOUND", `${resource} not found`, 404);
  }

  static rateLimited(retryAfterSeconds?: number): AppError {
    return new AppError("RATE_LIMITED", "Rate limit exceeded", 429, {
      retryAfterSeconds,
    });
  }

  static conflict(message: string): AppError {
    return new AppError("CONFLICT", message, 409);
  }

  static pipeline(message: string, context?: Record<string, unknown>): AppError {
    return new AppError("PIPELINE_ERROR", message, 500, context);
  }

  static storage(message: string, context?: Record<string, unknown>): AppError {
    return new AppError("STORAGE_ERROR", message, 500, context);
  }

  static internal(message = "Internal server error"): AppError {
    return new AppError("INTERNAL_ERROR", message, 500);
  }
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type ProjectStatus = "pending" | "converting" | "ready" | "error";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  source_image_path: string | null;
  source_image_hash: string | null;
  svg_path: string | null;
  svg_url: string | null;
  ai_suggestions: AISuggestionCache | null;
  status: ProjectStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export type ConversionStep = "upload" | "normalize" | "trace" | "assemble";
export type JobStatus = "pending" | "running" | "done" | "failed";

export interface ConversionJob {
  id: string;
  project_id: string;
  step: ConversionStep;
  status: JobStatus;
  started_at: string | null;
  completed_at: string | null;
  error: JobError | null;
}

export interface JobError {
  code: ErrorCode;
  message: string;
  context?: Record<string, unknown>;
}

// ─── AI Types (placeholder — AI agent owns AISuggestion shape) ───────────────

export interface AISuggestionCache {
  imageHash: string;
  suggestions: unknown; // typed by lib/ai/schemas.ts (AI agent owns)
  cachedAt: string;
}

// ─── API Request / Response Types ────────────────────────────────────────────

export interface CreateProjectRequest {
  name: string;
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  fileSizeBytes: number;
}

export interface CreateProjectResponse {
  project: Project;
  uploadUrl: string;
  storagePath: string;
}

export interface ConvertProjectRequest {
  colorCount?: number; // 2–16, default 8
}

export interface ConvertProjectResponse {
  jobId: string;
  projectId: string;
  status: JobStatus;
  cacheHit: boolean;
}

export interface JobStatusResponse {
  jobId: string;
  projectId: string;
  step: ConversionStep;
  status: JobStatus;
  progress: number; // 0–100
  startedAt: string | null;
  completedAt: string | null;
  error: JobError | null;
}

// ─── AI Icon Generation ───────────────────────────────────────────────────────

export type IconStyle = 'flat' | 'outline' | 'duotone';

export interface GenerateIconRequest {
  prompt: string;
  style: IconStyle;
  primaryColor: string;
  projectId?: string;
}

export interface GenerateIconResponse {
  svgContent: string;
}

// ─── Icon Library ─────────────────────────────────────────────────────────────

export interface Icon {
  id: string;
  user_id: string;
  prompt: string;
  description: string;
  style: IconStyle;
  primary_color: string;
  svg_content: string;
  path_count: number;
  is_public: boolean;
  tags: string[];
  download_count: number;
  created_at: string;
}

export interface IconListResponse {
  icons: Icon[];
  total: number;
  hasMore: boolean;
}

export interface SaveIconRequest {
  prompt: string;
  description: string;
  style: IconStyle;
  primaryColor: string;
  svgContent: string;
  pathCount: number;
  isPublic?: boolean;
}

// ─── Icon Style Transfer (v2) ────────────────────────────────────────────────

export interface IconStyleDNA {
  id: string
  libraryName: string
  sourceUrl: string
  gridSize: 16 | 20 | 24 | 32
  safeAreaPadding: number
  strokeWidth: number
  strokeLinecap: 'round' | 'square' | 'butt'
  strokeLinejoin: 'round' | 'miter' | 'bevel'
  cornerRadius: 'sharp' | 'slight' | 'rounded' | 'pill'
  fillStyle: 'outline' | 'filled' | 'duotone' | 'bold' | 'thin'
  colorMode: 'currentColor' | 'hardcoded' | 'multi'
  personality: string[]
  complexityTarget: 2 | 3 | 4 | 5
  sampleCount: number
  extractedAt: string
}

export interface ExtractDNARequest { url: string }
export interface ExtractDNAResponse { dna: IconStyleDNA; cached: boolean }
export interface StyleTransferRequest { svgContent: string; dnaId: string }
export interface StyleTransferResponse {
  svgContent: string
  description: string
  pathCount: number
  appliedDna: IconStyleDNA
}

export interface GenerateFromDNARequest {
  imageBase64: string
  imageMimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  prompt: string
  dnaId: string
}

export interface GenerateFromDNAResponse {
  svgContent: string
  description: string
  pathCount: number
  appliedDna: IconStyleDNA
}

// ─── AI Provider ─────────────────────────────────────────────────────────────

export type AIProvider = 'claude' | 'gemini'

// ─── Redis Cache Value Types ─────────────────────────────────────────────────

export interface ConversionCacheValue {
  projectId: string;
  svgStoragePath: string;
}

// ─── Logging ─────────────────────────────────────────────────────────────────

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  route: string;
  userId: string | null;
  durationMs?: number;
  error?: {
    code: ErrorCode;
    message: string;
    context?: Record<string, unknown>;
  };
  [key: string]: unknown;
}
