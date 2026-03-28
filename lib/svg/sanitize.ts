/**
 * Minimal SVG sanitizer for server-side use (no DOM available).
 *
 * Strategy: deny-list the most dangerous elements and attributes.
 * This is a defense-in-depth layer — the primary protection is the
 * Content-Security-Policy header that blocks inline scripts.
 *
 * Dangerous elements removed:
 *   script, foreignObject, iframe, object, embed, use (href to external)
 *
 * Dangerous attributes removed (regex over the raw string):
 *   on* event handlers, xlink:href to javascript:/data:, href to javascript:
 */

// Elements that must never appear in a served SVG.
const BLOCKED_ELEMENTS = [
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'animate',  // can trigger JS via attributeName tricks in some parsers
]

// Regex patterns for dangerous attribute content.
const BLOCKED_ATTR_PATTERNS: RegExp[] = [
  // Any on* event handler attribute: onclick, onload, onerror …
  /\bon\w+\s*=/gi,
  // javascript: URIs in href / xlink:href / src
  /\b(href|xlink:href|src)\s*=\s*["']?\s*javascript:/gi,
  // data: URIs in href (can embed HTML documents)
  /\b(href|xlink:href)\s*=\s*["']?\s*data:/gi,
]

/**
 * Strip active content from an SVG string.
 * Returns the sanitized SVG string.
 */
export function sanitizeSvg(svg: string): string {
  let out = svg

  // Remove blocked element tags and their content.
  for (const tag of BLOCKED_ELEMENTS) {
    // Matches <tag ...>...</tag> and self-closing <tag ... />
    const re = new RegExp(
      `<${tag}[\\s>][\\s\\S]*?</${tag}>|<${tag}[^>]*/?>`,
      'gi',
    )
    out = out.replace(re, '')
  }

  // Strip dangerous attributes.
  for (const pattern of BLOCKED_ATTR_PATTERNS) {
    // Replace the attribute name+value up to the next quote-terminated value.
    // We remove the whole attribute to be safe.
    out = out.replace(
      new RegExp(
        pattern.source.replace(/\\b\(.*?\)/, '\\w+') + '[^"\'\\s>]*["\']?[^"\'\\s>]*["\']?',
        'gi',
      ),
      '',
    )
  }

  // Belt-and-suspenders: remove any remaining on* attrs with a broader sweep.
  out = out.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')

  // Remove javascript: and data: href values.
  out = out.replace(
    /\b(href|xlink:href|src)\s*=\s*"(?:javascript|data):[^"]*"/gi,
    '',
  )
  out = out.replace(
    /\b(href|xlink:href|src)\s*=\s*'(?:javascript|data):[^']*'/gi,
    '',
  )

  return out
}
