# Showcase design brief

A one-page site for the live presentation (2026-10-31, 8:30). Audience: hackathon
judges and engineers. Its job: in five minutes of scrolling, show that this is a
real, working verification system, and be honest about what isn't built yet.

## Research notes

**Awwwards.** A jury-judged showcase of web design. Each site is scored on design,
usability, creativity and content (content counts, it is not decoration). The
Site-of-the-Day winners we looked at share a few habits: one strong idea carried
through the whole page instead of many small effects; type used as image (very
large, set tightly, often wide or condensed); restrained palettes with one accent;
motion tied to scroll position so the reader controls the pace; real product
material instead of illustration; and generous, uneven whitespace on a visible grid.

**supermemory.ai** (full-page capture, 1440 px, 6390 px tall).
- Layout: a fixed left rail (logo, page nav, an "on this page" index) and one
  narrow reading column (~640 px) on the right. Reads like documentation, not a
  marketing page. Hairline borders, square corners.
- Type: one family, Geist (17 px body, 40 px H1 at weight 400, nothing bold),
  Geist Mono at 11–12 px for buttons and small labels. A quiet, flat scale; the
  headline is set light rather than heavy.
- Colour: white, near-black text, one saturated blue for actions, links and the
  one highlighted bar in each chart. Imagery is blue/orange halftone photography.
- Motion: very little. Hover states and a sticky index. Confidence comes from
  content, not animation.
- Rhythm: short sections separated by hairlines; a "proof" block of real numbers
  (latency table, token chart, benchmark bars) with sources linked.
- Product: shown as numbers and charts with citations, not screenshots.
- Take-away for us: real numbers, cited; one accent; quiet type; let proof carry it.

**hackerrank.com.** A capture wasn't possible: the site's Akamai bot wall returns
"Access Denied" to headless Chromium, and we didn't get around it. Notes below come
from our own familiarity with the public site, not from a fresh capture.
- Layout: a centered marketing hero with product UI mockups, logo walls, then
  alternating text/image rows; a dark navy and bright green palette; bold
  geometric sans; customer logos and big numbers as social proof.
- Take-away for us, mostly by contrast: this is the category's default look
  (centered, logo-wall proof, alternating rows). We have no customers and won't
  pretend to, so our proof is test counts, timings and the code itself.

## Direction: "the assay office"

An assay office tests metal and stamps a hallmark on what passes. Nobody's opinion
is involved: the sample goes through fixed tests and the mark records the result.
That is what this product does for a candidate's claimed skills. The page borrows
that world: specimen panels, stamped marks, certificate cards, calibration ticks,
and a strict split between **paper** (what people read) and **the sandbox** (dark
sections, used only where candidate code runs or is judged).

## Name

Three candidates (one constant: `showcase/lib/site.ts` → `NAME`):
1. **Assay** — testing a sample to find what it really contains. Short, exact.
2. Proofmark — the stamp a gunsmith's proof house puts on a barrel that survived
   the test load.
3. Hallmark — the stamp on tested gold; too common a word to own.

Using **Assay**.

## Type

- Display: **Archivo** (variable, width axis), set at width 125 / weight 750–850,
  tight tracking. Wide letters read as stamped, like a hallmark punch. Used large
  and sparingly: hero, section titles, big numbers.
- Text: **Source Serif 4** (variable, optical sizes). A serif for prose gives the
  "report you can trust" register and contrasts clearly with the wide grotesk.
  19 px / 1.6 on desktop, 17 px on mobile, ≤ 68 characters per line.
- Code only: **JetBrains Mono**. Never used for labels or decoration, only for
  code, JSON and test output.
- All three are self-hosted via Fontsource npm packages (no font CDN).
- Scale (≈ 1.333, perfect fourth): 14 · 17 · 19 · 25 · 34 · 45 · 60 · 80 · clamp to 168 for the hero.
- Labels are sentence case, in the text face, small and muted. No all-caps eyebrows.

## Palette

| Token | Hex | Role |
| --- | --- | --- |
| paper | #E6E8E3 | page background: a cool mineral grey, not cream |
| ink | #161A17 | text on paper |
| graphite | #5B625D | secondary text, hairlines at 30 % |
| sandbox | #17201C | dark sections where code runs (deep green-black) |
| verdigris | #0E7A5C (on paper) / #3FD3A0 (on sandbox) | the one accent: pass marks, active stage, links |
| fail | #C2412D | semantic only: a failing test or a blocked request |

## Layout

12-column grid, max 1320 px, 24 px gutters (16 px side gutter on phones). Section
titles sit in columns 1–5; the evidence (code, card, diagram) sits off-axis in
7–12 or bleeds wider. Text is left-aligned everywhere; nothing is centered except
the orb.

```
 hero        [ ASSAY (huge, wide) ...................... ]
             [ promise + subline  ]   [ specimen: json → profile → task ]
 problem     [ two claims, large  ]          [ short explanation ]
 pipeline    [ sticky stage list  ]   [ sticky artifact panel, swaps on scroll ]
 trail map   [ title ]  [ full-width graph, A / B toggle ................ ]
 tiers       one comparison table: rows = what changes, columns = tiers
 trust       (sandbox) certificate card | grading code | threat model rows
 assistant   (sandbox) mock chat | orb (coming soon)
 product     screenshots in plain frames, slight offset
 progress    horizontal phase timeline with counted items
 stack       architecture strip + open-source list
 team        three names, the hackathon line
```

## Motion principles

- One orchestrated load moment: the hero specimen runs portfolio → profile → task
  once. Everything else is driven by the reader's scroll.
- Lenis smooth scroll; reveals are short (450 ms, 24 px rise, staggered 60 ms) and
  happen once. Counters run once when seen.
- Two signature moments: the pipeline (sticky, scroll-scrubbed) and the Trail Map
  (paths drawn along real function nodes, A/B switch).
- Small parallax on the hero type and product frames only.
- Only transform and opacity are animated. Heavy parts (Trail Map, orb, screenshots)
  are lazy. `prefers-reduced-motion` turns off Lenis, parallax and drawing: final
  states are shown immediately.

## What we're avoiding

Purple/blue gradients, glass cards, icon-in-circle feature grids, three identical
feature cards, all-caps tracked eyebrows, mono used as decoration, arrows appended
to link text, middle-dot meta strings, the cream + terracotta look, logo walls,
invented numbers, stock art. Copy speaks like the engineers who built it: what it
does, how, and what's not done yet.
