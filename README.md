# dr_ideate

Come up with YouTube video ideas from **live trend research**, filtered through
**your preferences** and **your blogs**, and keep the good ones as **favorites**.

React 19 + Vite · Convex backend · Claude (Anthropic API) with web search.
This is a small public test repo: it contains no secrets. The API key lives only
on your Convex deployment.

## How it works

1. **Preferences** — niche, audience, tone, preferred formats, topics to avoid, goals.
2. **Blogs & sources** — your own blogs (so the model learns your voice and what you have
   already covered) and blogs you follow (as research input).
3. **Research now** — one Convex action asks Claude, with web search and web fetch enabled,
   to find what is trending in your niche right now, read your sources, and return eight
   ideas as JSON: title, alternate titles, hook, angle, format, outline, thumbnail concept,
   tags, why-now, confidence, and the URLs each idea rests on.
4. **Favorites** — star any idea; it waits on the Favorites tab with room for a note.

## Run it

```bash
npm install
npx convex dev          # creates your Convex deployment, writes .env.local, regenerates convex/_generated
```

Set the API key on the Convex deployment (never in app code):

```bash
npx convex env set ANTHROPIC_API_KEY sk-ant-...
```

Optional tuning (defaults in `convex/lib/prompt.ts`):

| Convex env var | Default | Meaning |
|---|---|---|
| `IDEATE_MODEL` | `claude-opus-5-5` | Claude model used for research |
| `IDEATE_EFFORT` | `medium` | `low` · `medium` · `high` · `xhigh` · `max` — depth of reasoning per run |

In a second terminal:

```bash
npm run dev
```

Without `VITE_CONVEX_URL` the app shows a "not configured" page instead of a broken UI.
Without `ANTHROPIC_API_KEY`, a research run fails with a sentence saying so.

## Check it

```bash
npm test                 # vitest: prompt builder, parser, enum/validator agreement
npx tsc --noEmit         # app + convex
npm run build
```

## Layout

| Path | What |
|---|---|
| `convex/schema.ts` | `profiles`, `sources`, `researchRuns`, `ideas`, `ideaEvidence`, `favorites` |
| `convex/lib/prompt.ts` | Pure prompt builder, model and effort defaults |
| `convex/lib/ideas.ts` | Pure, defensive parser for the model reply |
| `convex/research.ts` | The run: Claude call with web tools → parse → rows |
| `convex/runs.ts` · `ideas.ts` · `profiles.ts` · `sources.ts` | Queries and mutations |
| `src/data/ideate.ts` | The one UI data-access layer (components never touch `api.*`) |
| `src/components/` | Ideas, Favorites, Preferences, Sources panels and the idea card |

## Notes

- **Single owner, no sign-in.** Every row carries `ownerKey = "local"`; adding users later
  means swapping that constant for a signed-in id (the column is already there).
- **On-demand only.** A scheduled daily brief would be a Convex cron calling `runs.start`.
- **Safety fallback is on.** Requests include Anthropic's server-side `fallbacks: "default"`,
  so a policy decline on the primary model re-runs on a fallback model in the same call.
  Remove the `betas`/`fallbacks` lines in `convex/research.ts` if you don't want that.
