import { createHash } from "crypto";
import { XMLParser } from "fast-xml-parser";

/**
 * Canonical form + content hash for SVG documents.
 *
 * WHY THIS EXISTS
 *
 * Exporting a new version costs the user a credit, and "new version" is decided
 * by the SVG's content hash. So two files that render identically MUST hash
 * identically, or users get charged for saving the same artwork twice.
 *
 * Raw bytes are not safe to hash. The same artwork legitimately differs by:
 *   - element ids (generated in the editor, not visual)
 *   - attribute order
 *   - float precision drift from pan/zoom/transform round-trips
 *   - whitespace and indentation
 *   - hex colour casing (#FFF vs #fff)
 *
 * canonicalizeSvg() strips exactly those differences and nothing else. Anything
 * that changes rendering — path geometry beyond 3 decimals, fills, strokes,
 * opacity, element order — still produces a different hash, because the user
 * really is exporting something new.
 *
 * Runs server-side (no DOM), so it uses fast-xml-parser rather than DOMParser.
 */

/** Decimal places kept for geometry. ~1/1000 of a viewBox unit is far below a pixel. */
const PRECISION = 3;

/** Attributes that carry no visual meaning and must not affect the hash. */
const IGNORED_ATTRS = new Set(["id", "class"]);

/** Attributes whose values are numeric and get precision-normalised. */
const NUMERIC_ATTRS = new Set([
  "d", "viewBox", "points", "transform",
  "x", "y", "width", "height",
  "cx", "cy", "r", "rx", "ry",
  "x1", "y1", "x2", "y2",
  "stroke-width", "stroke-dashoffset", "stroke-miterlimit",
  "opacity", "fill-opacity", "stroke-opacity", "stop-opacity", "offset",
]);

/** Attributes holding colour values, normalised to lowercase. */
const COLOR_ATTRS = new Set(["fill", "stroke", "stop-color", "flood-color", "color"]);

const NUMBER_RE = /-?\d*\.?\d+(?:[eE][-+]?\d+)?/g;

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const rounded = Number(n.toFixed(PRECISION));
  // Normalise -0 to 0 so a sign flip from a transform round-trip does not
  // create a "new version".
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/**
 * Rounds every number inside a geometry string (path data, transforms, viewBox)
 * while leaving commands and separators intact.
 */
function normalizeNumbers(value: string): string {
  return value.replace(NUMBER_RE, (match) => {
    const n = Number(match);
    return Number.isFinite(n) ? formatNumber(n) : match;
  });
}

function normalizeAttrValue(name: string, rawValue: unknown): string {
  const value = String(rawValue ?? "").trim().replace(/\s+/g, " ");
  if (NUMERIC_ATTRS.has(name)) return normalizeNumbers(value);
  // Colours are case-insensitive in SVG; #FFF and #fff are the same paint.
  // Only the casing is touched — never the digits, so #000000 stays intact.
  if (COLOR_ATTRS.has(name)) return value.toLowerCase();
  return value;
}

interface PreservedNode {
  [key: string]: unknown;
  ":@"?: Record<string, unknown>;
}

/** Serialises a parsed node list into a deterministic string. */
function serializeNodes(nodes: PreservedNode[]): string {
  let out = "";

  for (const node of nodes) {
    const tagName = Object.keys(node).find((k) => k !== ":@");
    if (!tagName) continue;

    if (tagName === "#text") {
      const text = String(node["#text"] ?? "").trim().replace(/\s+/g, " ");
      if (text) out += text;
      continue;
    }

    const rawAttrs = node[":@"] ?? {};
    const attrs = Object.entries(rawAttrs)
      .map(([key, value]) => [key.replace(/^@_/, ""), value] as const)
      .filter(([name]) => !IGNORED_ATTRS.has(name) && !name.startsWith("data-"))
      .map(([name, value]) => [name, normalizeAttrValue(name, value)] as const)
      // Sorted so attribute order in the source cannot change the hash.
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([name, value]) => `${name}="${value}"`)
      .join(" ");

    const children = (node[tagName] as PreservedNode[] | undefined) ?? [];
    const inner = serializeNodes(children);
    const open = attrs ? `<${tagName} ${attrs}` : `<${tagName}`;

    out += inner ? `${open}>${inner}</${tagName}>` : `${open}/>`;
  }

  return out;
}

/**
 * Returns a deterministic canonical string for an SVG document.
 *
 * The output is intended for hashing and diffing, not for display. It is close
 * to valid SVG but makes no promise of being renderable.
 *
 * If the document cannot be parsed, falls back to a whitespace-collapsed form of
 * the input. That is still deterministic, so hashing never becomes unstable —
 * it is only less tolerant of cosmetic differences.
 */
export function canonicalizeSvg(svg: string): string {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      preserveOrder: true,
      trimValues: true,
      parseAttributeValue: false,
      parseTagValue: false,
    });

    const parsed = parser.parse(svg) as PreservedNode[];
    const canonical = serializeNodes(parsed);
    return canonical || svg.trim().replace(/\s+/g, " ");
  } catch {
    return svg.trim().replace(/\s+/g, " ");
  }
}

/**
 * Lowercase hex SHA-256 of an SVG's canonical form.
 *
 * This is the version identity used by project_versions.content_hash, and
 * therefore the value that decides whether an export costs a credit.
 */
export function computeSvgHash(svg: string): string {
  return createHash("sha256").update(canonicalizeSvg(svg), "utf8").digest("hex");
}
