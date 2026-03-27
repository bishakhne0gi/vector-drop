import { createHash } from 'crypto'

/**
 * Returns the lowercase hex SHA-256 digest of the given buffer.
 * Used as a stable cache key for conversion results.
 */
export function computeImageHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}
