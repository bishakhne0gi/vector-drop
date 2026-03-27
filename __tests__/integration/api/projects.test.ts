/**
 * Integration tests for POST /api/projects
 * Requires: TEST_SUPABASE_URL + TEST_SUPABASE_ANON_KEY env vars
 * Run after backend Phase 1 is complete.
 */
import { describe, it, expect, beforeEach } from 'vitest'

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

describe('POST /api/projects', () => {
  it.todo('returns 201 with project id on valid upload')

  it.todo('returns 400 when no file is attached')

  it.todo('returns 400 for unsupported file type (PDF)')

  it.todo('returns 429 when rate limit is exceeded')

  it.todo('returns 401 when not authenticated')
})

describe('GET /api/jobs/[id]', () => {
  it.todo('returns 404 for non-existent job')

  it.todo('returns 403 for job owned by a different user')

  it.todo('returns job status when authenticated owner requests')
})
