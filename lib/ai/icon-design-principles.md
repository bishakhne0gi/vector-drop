# Icon Design Principles
> Source: Helena Zhang — "7 Principles of Icon Design" (UX Collective)
> These principles govern all AI-driven icon generation and style transfer in this project.

---

## 1. Clarity
An icon's primary goal is to communicate a concept **quickly and unambiguously**.

- Use familiar, standardised metaphors where they exist (gear = settings, envelope = email, magnifier = search)
- Avoid abstract or culturally ambiguous symbols unless the context makes meaning obvious
- New metaphors are only valid when they gain recognition through repeated, consistent exposure
- If a user cannot identify the concept within 2 seconds, the icon has failed

**Prompt guidance:** Always name the semantic concept being depicted. The icon must map to a single, clear idea — never try to communicate two concepts with one icon.

---

## 2. Readability
Icons must remain **legible at small sizes** (16px, 20px, 24px) without losing their identity.

- Maintain sufficient stroke weight — minimum 1.5px on a 24×24 grid
- Ensure adequate spacing between internal elements (e.g. between a clip and a board, between teeth on a gear)
- Avoid overly fine details that collapse at small sizes
- Elements that are too close together merge into an unrecognisable blob
- Test at 16px — if the silhouette is unrecognisable, simplify

**Prompt guidance:** Favour bold, open forms. If an element requires detail smaller than 1.5px at 24×24, remove it or abstract it into a simpler shape.

---

## 3. Alignment
Elements must be **optically balanced**, not just mathematically centred.

- Mathematical centre and optical centre differ — the eye reads shapes differently based on their visual weight
- A triangle centred by coordinates inside a circle will appear off-centre to the human eye; shift it slightly upward
- Apply optical corrections the same way typography does (e.g. capital O slightly overshoots the baseline)
- Symmetrical icons should feel symmetrical, not just measure symmetrical

**Prompt guidance:** After placing elements on the grid, apply a visual weight check. Heavy shapes (filled circles, thick strokes) pull the eye — compensate with position, not just math.

---

## 4. Brevity
Use **only the details necessary** to communicate the concept. No more.

- Every path element must justify its existence — if removing it doesn't break recognition, remove it
- Overly complex icons compete with themselves — details obscure the core shape
- The simplest version that still communicates correctly is always the right version
- 2–4 paths is the target range for a 24×24 icon; 5 is acceptable; 6+ requires strong justification

**Prompt guidance:** After generating an icon, ask: "What is the minimum number of paths needed to recognise this?" Strip everything else. Complexity is a failure mode, not a feature.

---

## 5. Consistency
Icon families must share **unified visual parameters** across every member.

- Stroke width must be identical across all icons in a set (e.g. always 1.5px, never mixing 1px and 2px)
- Fill style must be uniform — do not mix outline icons with filled icons unless that is a deliberate variant
- Line caps and joins must match (all `round`, or all `square` — never mixed)
- Corner radius treatment must be consistent (either all sharp corners or all rounded)
- Grid and safe area must be identical (all 24×24 with 1px padding, or all 20×20, etc.)
- Visual weight (how "heavy" an icon looks) should feel equal across the set

**Prompt guidance:** When generating an icon for an existing set, extract the DNA first — stroke width, linecap, linejoin, grid, fill mode — and enforce those values as hard constraints, not suggestions.

---

## 6. Personality
Icon sets carry a **distinctive character** that reflects a brand or product identity.

- Personality emerges from the combination of: stroke weight, corner treatment, fill style, metaphor choices, and level of detail
- Examples of distinct personalities:
  - **Lucide / Feather:** delicate, 1.5px strokes, fully rounded, airy — feels lightweight and modern
  - **Phosphor:** versatile, available in 6 weights, slightly more structured — feels systematic
  - **Heroicons:** confident, 24px solid + outline variants, generous padding — feels product-grade
  - **Waze-style:** playful, colourful fills, cartoon proportions — feels consumer/fun
- A consistent personality makes a set feel designed, not assembled

**Prompt guidance:** Before generating, define the personality target. Is it delicate or bold? Playful or serious? Round or angular? Lock these adjectives down and enforce them through every parameter decision.

---

## 7. Ease of Use
Great icons are **well-organised, documented, and tooling-friendly**.

- Icons should be named clearly and semantically (not `icon-23.svg` but `arrow-up-right.svg`)
- Variants should follow a predictable naming convention (`settings`, `settings-filled`, `settings-bold`)
- SVG output must be clean: no unnecessary groups, no inline styles, no vendor attributes, no comments
- `currentColor` should be used for strokes/fills so the icon responds to CSS colour context
- viewBox must be standardised across the set
- Icons should be tested in their actual usage context (dark backgrounds, small sizes, coloured containers)

**Prompt guidance:** Output icons with `stroke="currentColor"` and `fill="none"` (for outline style) or `fill="currentColor"` (for filled style). Never hardcode colour values. Always use `viewBox="0 0 24 24"`.

---

## Style DNA Parameters (for Style Transfer)

When extracting or enforcing a library's design language, these are the exact parameters to capture:

```ts
type IconStyleDNA = {
  // Geometry
  gridSize: 16 | 20 | 24 | 32        // viewBox dimension
  safeAreaPadding: number             // inset from edge (e.g. 1 for 24-grid = draw within 2–22)
  strokeWidth: number                 // e.g. 1, 1.5, 2
  strokeLinecap: 'round' | 'square' | 'butt'
  strokeLinejoin: 'round' | 'miter' | 'bevel'
  cornerRadius: 'sharp' | 'slight' | 'rounded' | 'pill'

  // Style
  fillStyle: 'outline' | 'filled' | 'duotone' | 'bold' | 'thin'
  colorMode: 'currentColor' | 'hardcoded' | 'multi'

  // Character
  personality: string[]               // e.g. ['delicate', 'airy', 'minimal']
  complexityTarget: 2 | 3 | 4 | 5    // target path count

  // Meta
  libraryName: string
  sourceUrl: string
  sampleCount: number                 // how many icons were analysed to derive this
}
```

---

## Checklist for Every Generated Icon

Before accepting any AI-generated icon as output, verify:

- [ ] Concept is immediately recognisable (Clarity)
- [ ] Legible at 16px — test the silhouette (Readability)
- [ ] Visually centred, not just mathematically centred (Alignment)
- [ ] Fewest paths needed — nothing decorative (Brevity)
- [ ] Stroke width, linecap, linejoin match the target set's DNA (Consistency)
- [ ] Corner treatment matches the set's personality (Personality)
- [ ] Uses `currentColor`, clean paths, semantic naming (Ease of Use)
- [ ] All coordinates within the safe area (no clipping)
- [ ] No elements other than `<path>` inside the SVG
