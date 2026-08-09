import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { AppError } from "@/lib/types";

/**
 * Object storage on Cloudflare R2.
 *
 * This replaced Supabase Storage, which had run out of free quota. Only the
 * bytes moved — Postgres is still Supabase. Object keys were carried over
 * unchanged (`projects/{userId}/{uuid}/{file}`, `projects/{id}/output.svg`,
 * `projects/{id}/versions/{hash}.svg`), so every `source_image_path`,
 * `svg_path` and `storage_path` already in the database still resolves.
 *
 * The bucket is private. Browsers never hold a credential: uploads and reads
 * both go through short-lived presigned URLs minted here, server-side.
 */

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

export const R2_BUCKET = process.env.R2_BUCKET ?? "vectordrop-images";

let client: S3Client | null = null;

/**
 * Built lazily and cached. Constructing at module scope would crash any route
 * that merely imports this file when the env is half-configured — including
 * routes that never touch storage.
 */
export function r2(): S3Client {
  if (client) return client;

  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    throw AppError.storage(
      "R2 is not configured — set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY",
    );
  }

  client = new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });

  return client;
}

function isNotFound(err: unknown): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return (
    e?.name === "NoSuchKey" ||
    e?.name === "NotFound" ||
    e?.$metadata?.httpStatusCode === 404
  );
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Downloads an object in full. Throws AppError.storage if it is missing. */
export async function downloadObject(key: string): Promise<Buffer> {
  try {
    const res = await r2().send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    );
    if (!res.Body) throw new Error("empty body");
    return Buffer.from(await res.Body.transformToByteArray());
  } catch (err) {
    throw AppError.storage(`Failed to download ${key}: ${message(err)}`, {
      storagePath: key,
    });
  }
}

/** Convenience for the SVG paths, which are always UTF-8 text. */
export async function downloadText(key: string): Promise<string> {
  return (await downloadObject(key)).toString("utf8");
}

export async function uploadObject(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
): Promise<void> {
  try {
    await r2().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  } catch (err) {
    throw AppError.storage(`Failed to upload ${key}: ${message(err)}`, {
      storagePath: key,
    });
  }
}

/**
 * Server-side copy — the bytes never travel through this process.
 *
 * Unlike the Supabase equivalent this overwrites the destination, so callers
 * no longer have to delete it first. It still fails when the SOURCE is
 * missing, which is what the conversion cache relies on to detect a stale
 * entry.
 */
export async function copyObject(fromKey: string, toKey: string): Promise<void> {
  await r2().send(
    new CopyObjectCommand({
      Bucket: R2_BUCKET,
      // CopySource is bucket-qualified and must be URL-encoded — keys contain
      // slashes and, via the user's filename, potentially spaces.
      CopySource: `${R2_BUCKET}/${encodeURIComponent(fromKey).replace(/%2F/g, "/")}`,
      Key: toKey,
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  try {
    await r2().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  } catch (err) {
    if (isNotFound(err)) return; // deleting something absent is a no-op
    throw AppError.storage(`Failed to delete ${key}: ${message(err)}`, {
      storagePath: key,
    });
  }
}

/**
 * Presigning is a pure local computation — it succeeds for keys that do not
 * exist. Callers that used to rely on Supabase's `createSignedUrl` returning
 * an error for a missing file must check this first.
 */
export async function objectExists(key: string): Promise<boolean> {
  try {
    await r2().send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch (err) {
    if (isNotFound(err)) return false;
    throw AppError.storage(`Failed to stat ${key}: ${message(err)}`, {
      storagePath: key,
    });
  }
}

/** A short-lived URL a browser can GET directly. */
export async function signedDownloadUrl(
  key: string,
  expiresInSeconds: number,
): Promise<string> {
  return getSignedUrl(
    r2(),
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn: expiresInSeconds },
  );
}

/**
 * A short-lived URL a browser can PUT directly to.
 *
 * `contentType` is part of the signature: the upload is rejected unless the
 * client sends exactly this Content-Type. That is deliberate — it stops a
 * leaked URL being used to park something other than the declared image type.
 */
export async function signedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 600,
): Promise<string> {
  return getSignedUrl(
    r2(),
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: expiresInSeconds },
  );
}
