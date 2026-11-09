# dr_ideate

Come up with YouTube video ideas from **live trend research**, filtered through
**your preferences** and **your blogs**, and keep the good ones as **favorites**.

React 19 + Vite · Convex backend · Claude (Anthropic API) with web search.
**Bring your own key:** you paste your Anthropic API key into the app. It stays in your
browser, travels with each research run, and is never written to the database. This is a
small public test repo and contains no secrets.

## How it works

1. **Preferences** — niche, audience, tone, preferred formats, topics to avoid, goals.
2. **Blogs & sources** — your own blogs (so the model learns your voice and what you have
   already covered) and blogs you follow (as research input).
3. **Research now** — with your API key entered, one Convex action asks Claude, with web search and web fetch enabled,
   to find what is trending in your niche right now, read your sources, and return eight
   ideas as JSON: title, alternate titles, hook, angle, format, outline, thumbnail concept,
   tags, why-now, confidence, and the URLs each idea rests on.
4. **Favorites** — star any idea; it waits on the Favorites tab with room for a note.

## Run it

```bash
npm install
npx convex dev          # creates your Convex deployment, writes .env.local, regenerates convex/_generated
```

Optional tuning on the Convex deployment (`npx convex env set NAME value`; defaults in `convex/lib/prompt.ts`):

| Convex env var | Default | Meaning |
|---|---|---|
| `IDEATE_MODEL` | `claude-opus-5-5` | Claude model used for research |
| `IDEATE_EFFORT` | `medium` | `low` · `medium` · `high` · `xhigh` · `max` — depth of reasoning per run |
| `ANTHROPIC_API_KEY` | unset | Fallback key for a private deployment, used only when the key field in the app is empty |

In a second terminal:

```bash
npm run dev
```

Open the app, paste your Anthropic API key (from console.anthropic.com) in the field above
the run bar, fill in Preferences, add a blog or two, then press **Research now**.

Without `VITE_CONVEX_URL` the app shows a "not configured" page instead of a broken UI.
Without a key, the Research button stays disabled; a rejected key fails the run with a sentence.

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
| `convex/research.ts` | The public action: creates the run, calls Claude with web tools, parses, writes rows |
| `convex/runs.ts` · `ideas.ts` · `profiles.ts` · `sources.ts` | Queries and mutations |
| `src/data/ideate.ts` | The one UI data-access layer (components never touch `api.*`) |
| `src/components/` | Ideas, Favorites, Preferences, Sources panels and the idea card |

## Notes

- **Single owner, no sign-in.** Every row carries `ownerKey = "local"`; adding users later
  means swapping that constant for a signed-in id (the column is already there).
- **Bring your own key.** The key is a per-run argument to the `research.start` action and lives
  in the action's memory only. The browser keeps it in `localStorage` under `ideate.apiKey`.
- **On-demand only.** A scheduled daily brief would be a Convex cron with a deployment-side key.
- **Safety fallback is on.** Requests include Anthropic's server-side `fallbacks: "default"`,
  so a policy decline on the primary model re-runs on a fallback model in the same call.
  Remove the `betas`/`fallbacks` lines in `convex/research.ts` if you don't want that.
