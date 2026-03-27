import { createHash } from 'crypto'
import { load } from 'cheerio'
import { callWithTool, MODELS } from './providerAdapter'
import { IconStyleDNASchema, ExtractDNAToolInputSchema } from './schemas'
import { EXTRACT_DNA_SYSTEM_PROMPT } from './prompts'
import { cacheGet, cacheSet } from '@/lib/cache/redis'
import { AppError } from '@/lib/types'
import type { IconStyleDNA, AIProvider } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const DNA_TTL = 7 * 24 * 60 * 60 // 7 days
const DESIRED_SAMPLE_COUNT = 20
const MIN_SVG_CHARS = 50
const FETCH_TIMEOUT_MS = 10_000
const SVG_FETCH_TIMEOUT_MS = 8_000

// ─── Known Library Map (Strategy 1) ──────────────────────────────────────────

interface KnownLibrary {
  package: string
  path: string
  name: string
}

const KNOWN_LIBRARIES: Record<string, KnownLibrary> = {
  'phosphoricons.com':        { package: '@phosphor-icons/core',         path: 'assets/regular',  name: 'Phosphor Icons' },
  'lucide.dev':               { package: 'lucide-static',                path: 'icons',           name: 'Lucide' },
  'heroicons.com':            { package: 'heroicons',                    path: '24/outline',      name: 'Heroicons' },
  'tabler-icons.io':          { package: '@tabler/icons',                path: 'icons/outline',   name: 'Tabler Icons' },
  'iconoir.com':              { package: 'iconoir',                      path: 'icons',           name: 'Iconoir' },
  'feathericons.com':         { package: 'feather-icons',                path: 'dist/icons',      name: 'Feather Icons' },
  'remixicon.com':            { package: 'remixicon',                    path: 'icons/line',      name: 'Remix Icon' },
  'icons.getbootstrap.com':   { package: 'bootstrap-icons',              path: 'icons',           name: 'Bootstrap Icons' },
  'ionic.io':                 { package: 'ionicons',                     path: 'dist/svg',        name: 'Ionicons' },
  'fontawesome.com':          { package: '@fortawesome/fontawesome-free', path: 'svgs/regular',   name: 'Font Awesome' },
  'material.io':              { package: '@material-design-icons/svg',   path: 'action',          name: 'Material Icons' },
  'radix-ui.com':             { package: '@radix-ui/react-icons',        path: '',                name: 'Radix Icons' },
  'ant.design':               { package: '@ant-design/icons-svg',        path: 'src/asn',         name: 'Ant Design Icons' },
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

function hashUrl(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 16)
}

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** Sleep for ms milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Download a single SVG URL.  Returns null on any failure or if the response
 * body does not look like SVG.
 */
async function downloadSvg(url: string): Promise<{ svg: string; filename: string } | null> {
  try {
    const res = await fetchWithTimeout(url, SVG_FETCH_TIMEOUT_MS)
    if (!res.ok) return null
    const text = await res.text()
    if (!text.includes('<svg') || text.length < MIN_SVG_CHARS) return null
    const filename = url.split('/').pop() ?? 'icon.svg'
    return { svg: text, filename }
  } catch {
    return null
  }
}

/**
 * Pick a diverse sample of `count` items from `arr` spread across the full
 * range.  Taking every Nth item avoids the "first 20 all start with A"
 * problem.
 */
function diverseSample<T>(arr: T[], count: number): T[] {
  if (arr.length <= count) return arr
  const step = Math.floor(arr.length / count)
  const result: T[] = []
  for (let i = 0; i < count; i++) {
    result.push(arr[i * step])
  }
  return result
}

// ─── Strategy 3: unpkg directory listing + SVG download ──────────────────────

/**
 * Resolve relative hrefs found in an unpkg directory listing to full URLs.
 */
function resolveUnpkgHref(href: string, baseUrl: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) return href
  if (href.startsWith('/')) return `https://unpkg.com${href}`
  return new URL(href, baseUrl).href
}

/**
 * Given a directory listing URL, collect all .svg hrefs (and optionally
 * recurse one level into subdirectories).
 */
async function collectSvgUrlsFromDirectory(
  dirUrl: string,
  recurse = true,
): Promise<string[]> {
  let res: Response
  try {
    res = await fetchWithTimeout(dirUrl, FETCH_TIMEOUT_MS)
  } catch {
    return []
  }
  if (!res.ok) return []

  const html = await res.text()
  const $ = load(html)
  const svgUrls: string[] = []
  const subDirUrls: string[] = []

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    if (!href || href === '../' || href === './') return
    const full = resolveUnpkgHref(href, dirUrl)
    if (href.endsWith('.svg')) {
      svgUrls.push(full)
    } else if (recurse && (href.endsWith('/') || !href.includes('.'))) {
      // Potential sub-directory — only recurse one level
      subDirUrls.push(full)
    }
  })

  if (svgUrls.length === 0 && recurse && subDirUrls.length > 0) {
    // Try the first sub-directory that looks like icons/svg
    const iconDirKeywords = ['icon', 'svg', 'svgs', 'outline', 'regular', 'line', 'assets']
    const preferred = subDirUrls.find((u) =>
      iconDirKeywords.some((kw) => u.toLowerCase().includes(kw)),
    ) ?? subDirUrls[0]
    return collectSvgUrlsFromDirectory(preferred, false)
  }

  return svgUrls
}

/**
 * Fetch up to DESIRED_SAMPLE_COUNT SVGs from an unpkg package/path.
 * Returns an empty array (never throws) so callers can fall through to the
 * next strategy.
 */
async function fetchSVGsFromUnpkg(
  packageName: string,
  subPath: string,
  _libraryName: string,
): Promise<Array<{ svg: string; filename: string }>> {
  const baseDir = subPath
    ? `https://unpkg.com/${packageName}/${subPath}/`
    : `https://unpkg.com/${packageName}/`

  // Quick 404 check on the package root
  try {
    const probe = await fetchWithTimeout(`https://unpkg.com/${packageName}/`, FETCH_TIMEOUT_MS)
    if (!probe.ok) return []
  } catch {
    return []
  }

  const allSvgUrls = await collectSvgUrlsFromDirectory(baseDir, true)
  if (allSvgUrls.length === 0) return []

  const selected = diverseSample(allSvgUrls, DESIRED_SAMPLE_COUNT)

  // Download with a small delay between batches to avoid hammering unpkg
  const results: Array<{ svg: string; filename: string }> = []
  for (let i = 0; i < selected.length; i++) {
    if (i > 0 && i % 10 === 0) {
      await sleep(100)
    }
    const result = await downloadSvg(selected[i])
    if (result) results.push(result)
  }

  return results
}

// ─── Strategy 2: auto-detect npm package from page HTML ──────────────────────

/**
 * Extract candidate npm package names from CDN URLs.
 * Handles:
 *   https://unpkg.com/@scope/pkg@version/...
 *   https://cdn.jsdelivr.net/npm/@scope/pkg@version/...
 */
function extractPackageFromCdnUrl(cdnUrl: string): string | null {
  try {
    const url = new URL(cdnUrl)
    const pathParts = url.pathname.replace(/^\/npm\//, '/').split('/').filter(Boolean)
    if (!pathParts.length) return null
    // scoped packages: @scope/pkg
    if (pathParts[0].startsWith('@') && pathParts.length >= 2) {
      const scope = pathParts[0]
      const pkg = pathParts[1].split('@')[0]
      return `${scope}/${pkg}`
    }
    return pathParts[0].split('@')[0]
  } catch {
    return null
  }
}

interface AutoDetectResult {
  packageName: string
  libraryName: string
}

async function autoDetectPackage(url: string): Promise<{ html: string; candidates: AutoDetectResult[] }> {
  let html = ''
  try {
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
  } catch (err) {
    if (err instanceof AppError) throw err
    throw AppError.validation(
      'Could not reach the provided URL — check it is publicly accessible',
    )
  }

  const $ = load(html)
  const candidates: AutoDetectResult[] = []
  const seen = new Set<string>()

  function addCandidate(pkgName: string, libName: string) {
    if (!pkgName || seen.has(pkgName)) return
    seen.add(pkgName)
    candidates.push({ packageName: pkgName, libraryName: libName })
  }

  // (a) CDN script/link tags
  $('script[src], link[href]').each((_, el) => {
    const src = $(el).attr('src') ?? $(el).attr('href') ?? ''
    if (src.includes('unpkg.com') || src.includes('cdn.jsdelivr.net')) {
      const pkg = extractPackageFromCdnUrl(src)
      if (pkg) addCandidate(pkg, pkg)
    }
  })

  // (b) npmjs.com links
  $('a[href*="npmjs.com/package/"]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const match = href.match(/npmjs\.com\/package\/([@\w/-]+)/)
    if (match) addCandidate(match[1], match[1])
  })

  // (c) GitHub links → owner/repo → try as package
  $('a[href*="github.com/"]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const match = href.match(/github\.com\/([\w-]+\/[\w-]+)/)
    if (match) {
      const repo = match[1]
      // Use only the repo part (not owner/repo) as package name candidate
      const repoPart = repo.split('/')[1]
      addCandidate(repoPart, repoPart)
    }
  })

  // (d) meta tag
  $('meta[name="npm-package"]').each((_, el) => {
    const content = $(el).attr('content') ?? ''
    if (content) addCandidate(content, content)
  })

  return { html, candidates }
}

// ─── Strategy 4: direct HTML scraping fallback ───────────────────────────────

function extractInlineSvgsFromHtml(html: string): Array<{ svg: string; filename: string }> {
  const $ = load(html)
  const results: Array<{ svg: string; filename: string }> = []

  $('svg[viewBox]').each((i, el) => {
    const svgStr = $.html(el)
    if (svgStr && svgStr.length >= MIN_SVG_CHARS) {
      results.push({ svg: svgStr, filename: `inline-${i}.svg` })
    }
  })

  return results
}

async function fetchImgSvgs(
  html: string,
  baseUrl: string,
): Promise<Array<{ svg: string; filename: string }>> {
  const $ = load(html)
  const svgImgUrls: string[] = []

  $('img[src]').each((_, el) => {
    const src = $(el).attr('src') ?? ''
    if (src.endsWith('.svg')) {
      try {
        svgImgUrls.push(new URL(src, baseUrl).href)
      } catch {
        // ignore malformed URLs
      }
    }
  })

  const results = await Promise.allSettled(
    svgImgUrls.slice(0, DESIRED_SAMPLE_COUNT).map(downloadSvg),
  )
  return results
    .filter((r): r is PromiseFulfilledResult<{ svg: string; filename: string } | null> =>
      r.status === 'fulfilled',
    )
    .map((r) => r.value)
    .filter((v): v is { svg: string; filename: string } => v !== null)
}

// ─── Orchestration ────────────────────────────────────────────────────────────

/**
 * Run all four strategies in order, stopping as soon as we have >= 10 SVGs.
 */
async function collectSvgSamples(url: string): Promise<{
  samples: Array<{ svg: string; filename: string }>
  libraryName: string
}> {
  // ── Strategy 1: Known library map ───────────────────────────────────────────
  const hostname = new URL(url).hostname.replace(/^www\./, '')
  const knownEntry = KNOWN_LIBRARIES[hostname]

  if (knownEntry) {
    console.info('[extractStyleDNA] Strategy 1 hit:', knownEntry.name)
    const samples = await fetchSVGsFromUnpkg(
      knownEntry.package,
      knownEntry.path,
      knownEntry.name,
    )
    if (samples.length >= 10) {
      return { samples, libraryName: knownEntry.name }
    }
    console.warn(
      `[extractStyleDNA] Strategy 1 yielded only ${samples.length} SVGs for ${knownEntry.name}, falling through`,
    )
  }

  // ── Strategy 2: Auto-detect package from page HTML ──────────────────────────
  let pageHtml = ''
  let detectedName = 'Unknown Library'
  const candidates: AutoDetectResult[] = []

  console.info('[extractStyleDNA] Strategy 2: auto-detecting package from page HTML')
  try {
    const detected = await autoDetectPackage(url)
    pageHtml = detected.html
    if (detected.candidates.length > 0) {
      candidates.push(...detected.candidates)
      detectedName = detected.candidates[0].libraryName
    }
  } catch (err) {
    if (err instanceof AppError) throw err
    // non-fatal — fall through
  }

  // ── Strategy 3: unpkg for each candidate ───────────────────────────────────
  let bestSamples: Array<{ svg: string; filename: string }> = []
  let bestLibraryName = knownEntry?.name ?? detectedName

  for (const candidate of candidates) {
    console.info('[extractStyleDNA] Strategy 3: trying unpkg for', candidate.packageName)
    const samples = await fetchSVGsFromUnpkg(candidate.packageName, '', candidate.libraryName)
    if (samples.length > bestSamples.length) {
      bestSamples = samples
      bestLibraryName = candidate.libraryName
    }
    if (bestSamples.length >= 10) break
  }

  if (bestSamples.length >= 10) {
    return { samples: bestSamples, libraryName: bestLibraryName }
  }

  // ── Strategy 4: Direct HTML scraping ────────────────────────────────────────
  console.info('[extractStyleDNA] Strategy 4: direct HTML scraping')

  // Fetch page HTML if we don't have it yet
  if (!pageHtml) {
    try {
      const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS)
      if (res.ok) pageHtml = await res.text()
    } catch {
      // ignore — we'll work with whatever we have
    }
  }

  if (pageHtml) {
    const inlineSvgs = extractInlineSvgsFromHtml(pageHtml)
    const imgSvgs = await fetchImgSvgs(pageHtml, url)
    const scraped = [...inlineSvgs, ...imgSvgs]

    if (scraped.length > bestSamples.length) {
      bestSamples = scraped
    }
  }

  // Merge all samples found across all strategies and cap at DESIRED_SAMPLE_COUNT
  const merged = diverseSample(bestSamples, DESIRED_SAMPLE_COUNT)
  return { samples: merged, libraryName: bestLibraryName }
}

// ─── AI analysis ──────────────────────────────────────────────────────────────

const MAX_SVG_CHARS = 1500   // per icon — keeps each sample readable but bounded
const MAX_TOTAL_CHARS = 24000 // total SVG block — well within Haiku's context

async function callAIForDNA(
  samples: Array<{ svg: string; filename: string }>,
  libraryName: string,
  sourceUrl: string,
  provider: AIProvider,
): Promise<unknown> {
  // Truncate each SVG and cap the total block size to avoid token overflow
  let totalChars = 0
  const cappedSamples: Array<{ svg: string; filename: string }> = []
  for (const { svg, filename } of samples) {
    const trimmed = svg.length > MAX_SVG_CHARS ? svg.slice(0, MAX_SVG_CHARS) + '\n<!-- truncated -->' : svg
    if (totalChars + trimmed.length > MAX_TOTAL_CHARS) break
    cappedSamples.push({ svg: trimmed, filename })
    totalChars += trimmed.length
  }

  const svgBlock = cappedSamples
    .map(({ svg, filename }) => `--- ${filename} ---\n${svg}`)
    .join('\n\n')

  const userMessage = [
    `Library: ${libraryName}`,
    `Source URL: ${sourceUrl}`,
    `Samples found: ${samples.length}`,
    '',
    'SVG samples:',
    '',
    svgBlock,
  ].join('\n')

  return callWithTool({
    provider,
    model: MODELS.dnaExtract,
    systemPrompt: EXTRACT_DNA_SYSTEM_PROMPT,
    userContent: [{ type: 'text', text: userMessage }],
    tool: {
      name: 'extract_style_dna',
      description: 'Return the extracted design DNA of the icon library',
      inputSchema: ExtractDNAToolInputSchema,
    },
  })
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function extractStyleDNA(
  url: string,
  provider: AIProvider = 'claude',
): Promise<{ dna: IconStyleDNA; cached: boolean }> {
  // Validate URL scheme
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw AppError.validation('URL must start with http:// or https://')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw AppError.validation('URL must start with http:// or https://')
  }

  const urlHash = hashUrl(url)
  const cacheKey = `ai:dna:${urlHash}`

  // Cache check
  const cachedValue = await cacheGet<IconStyleDNA>(cacheKey)
  if (cachedValue) {
    const validated = IconStyleDNASchema.safeParse(cachedValue)
    if (validated.success) {
      return { dna: validated.data, cached: true }
    }
  }

  // Collect SVG samples via cascading strategies
  const { samples, libraryName } = await collectSvgSamples(url)

  if (samples.length < 3) {
    throw AppError.validation(
      'Could not find enough SVG icons at this URL. Try a direct link to the icon library\'s documentation or CDN.',
    )
  }

  if (samples.length < 10) {
    console.warn(
      `[extractStyleDNA] Proceeding with only ${samples.length} samples for ${url}`,
    )
  }

  // Call AI for DNA extraction
  let rawInput: unknown
  try {
    rawInput = await callAIForDNA(samples, libraryName, url, provider)
  } catch (err) {
    if (err instanceof AppError) throw err
    const status = (err as { status?: number }).status
    if (status === 429) throw err
    console.error('[extractStyleDNA] AI call failed:', err)
    throw AppError.pipeline('Failed to extract style DNA from the provided URL')
  }

  // Build full IconStyleDNA with metadata fields AI doesn't provide
  const dnaCandidate = {
    ...(rawInput as object),
    id: urlHash,
    sourceUrl: url,
    sampleCount: samples.length,
    extractedAt: new Date().toISOString(),
  }

  const validated = IconStyleDNASchema.safeParse(dnaCandidate)
  if (!validated.success) {
    console.error('[extractStyleDNA] Zod parse failure:', validated.error.flatten())
    throw AppError.pipeline('Failed to extract style DNA from the provided URL')
  }

  const dna = validated.data

  await cacheSet(cacheKey, dna, DNA_TTL)

  return { dna, cached: false }
}
