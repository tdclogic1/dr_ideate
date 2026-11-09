# dr_ideate — design (2026-11-08)

**Intent.** A personal YouTube ideation tool. Set preferences once, register blogs, then on
demand research current trends, blend them with the preferences and blog content, and get
concrete, evidenced video ideas. Star the good ones.

**Decisions (owner, 2026-11-08).** On-demand runs only. Blogs mean both the owner's own
(voice, already-covered) and followed (research input). Each idea is a full package.
Small public test repo: no sign-in, no external platform dependencies.

**Shape.**
- One public Convex action per run calls Claude (`claude-opus-5-5` by default) with the
  `web_search` and `web_fetch` server tools and asks for a JSON object of ideas.
  Bring your own key: the browser holds the Anthropic API key and passes it as an action
  argument; it is never stored in Convex. A deployment env var is an optional fallback.
- Tables: `profiles`, `sources`, `researchRuns`, `ideas`, `ideaEvidence` (one row per cited
  URL), `favorites` (idea + note). `ownerKey` first everywhere; `createdAt`/`updatedAt` owned.
- Pure logic in `convex/lib/` (prompt, parser, enums, validators) with vitest coverage.
- UI: four tabs — Ideas (run bar + cards), Favorites (cards + notes), Preferences,
  Blogs & sources. One data-access layer in `src/data/ideate.ts`.

**Failure handling.** Missing Convex URL → "not configured" page. Missing key →
the Research button is disabled; a rejected key fails the run with a sentence. Refusal, token cut-off, or an unparseable reply →
the run row records the reason, shown under the run bar.

**Later, if wanted.** Daily scheduled brief; sign-in and a per-person owner key.
