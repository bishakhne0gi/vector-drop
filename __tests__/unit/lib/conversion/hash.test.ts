import { describe, it, expect } from 'vitest'
import { computeImageHash } from '@/lib/conversion/hash'

describe('computeImageHash', () => {
  const bytes = Buffer.from('fake-image-bytes-for-testing')
  const bytes2 = Buffer.from('different-image-bytes')

  it('returns a lowercase hex string of length 64 (SHA-256)', () => {
    expect(computeImageHash(bytes)).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic — same bytes produce the same hash', () => {
    expect(computeImageHash(bytes)).toBe(computeImageHash(Buffer.from('fake-image-bytes-for-testing')))
  })

  it('produces different hashes for different inputs', () => {
    expect(computeImageHash(bytes)).not.toBe(computeImageHash(bytes2))
  })

  it('is stable across 5 calls', () => {
    const hashes = Array.from({ length: 5 }, () => computeImageHash(bytes))
    expect(new Set(hashes).size).toBe(1)
  })

  it('handles a single-byte buffer', () => {
    expect(computeImageHash(Buffer.from([0x00]))).toMatch(/^[0-9a-f]{64}$/)
  })

  it('handles an empty buffer (SHA-256 of empty = known value)', () => {
    expect(computeImageHash(Buffer.alloc(0))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    )
  })

  it('handles a 1 MB buffer', () => {
    expect(computeImageHash(Buffer.alloc(1024 * 1024, 0xab))).toMatch(/^[0-9a-f]{64}$/)
  })

  it('output is always lowercase', () => {
    const hash = computeImageHash(bytes)
    expect(hash).toBe(hash.toLowerCase())
  })
})
