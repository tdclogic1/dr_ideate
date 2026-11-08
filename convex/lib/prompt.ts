// Pure prompt builder — no Convex runtime, no network. Unit-tested in tests/prompt.test.ts.
import { IDEA_FORMAT, type SourceKind } from "./enums";

export type ProfileInput = {
  channelName?: string;
  niche: string;
  audience?: string;
  tone?: string;
  formats: string[];
  avoidTopics: string[];
  goals?: string;
  notes?: string;
};
export type SourceInput = { url: string; title?: string; kind: SourceKind; notes?: string };

export const IDEAS_PER_RUN = 8;
export const DEFAULT_MODEL = "claude-opus-5-5";

export const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
export type Effort = (typeof EFFORTS)[number];
export const DEFAULT_EFFORT: Effort = "medium";
export function isEffort(x: string): x is Effort {
  return (EFFORTS as readonly string[]).includes(x);
}

/** JSON schema the reply is asked to follow; the parser re-validates regardless. */
export const IDEA_OUTPUT_SCHEMA = {
  type: "object",
  required: ["ideas"],
  properties: {
    ideas: {
      type: "array",
      items: {
        type: "object",
        required: ["title", "hook", "angle", "format", "outline", "whyNow", "confidence", "evidence"],
        properties: {
          title: { type: "string" },
          altTitles: { type: "array", items: { type: "string" } },
          hook: { type: "string" },
          angle: { type: "string" },
          format: { type: "string", enum: [...IDEA_FORMAT] },
          outline: { type: "array", items: { type: "string" } },
          thumbnailConcept: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          whyNow: { type: "string" },
          confidence: { type: "integer", minimum: 0, maximum: 100 },
          evidence: {
            type: "array",
            items: {
              type: "object",
              required: ["url"],
              properties: { url: { type: "string" }, title: { type: "string" }, snippet: { type: "string" } },
            },
          },
        },
      },
    },
  },
} as const;

const line = (label: string, value: string | undefined) => (value && value.trim() ? `- ${label}: ${value.trim()}` : null);

export function buildResearchPrompt(
  profile: ProfileInput,
  sources: SourceInput[],
  focus?: string,
  count = IDEAS_PER_RUN,
  today = new Date().toISOString().slice(0, 10),
): string {
  const mine = sources.filter((s) => s.kind === "mine");
  const followed = sources.filter((s) => s.kind === "followed");
  const src = (s: SourceInput) => `- ${s.url}${s.title ? ` (${s.title})` : ""}${s.notes ? ` — ${s.notes}` : ""}`;

  const creator = [
    line("Channel", profile.channelName),
    line("Niche / topics", profile.niche),
    line("Audience", profile.audience),
    line("Tone", profile.tone),
    profile.formats.length ? `- Preferred formats: ${profile.formats.join(", ")}` : null,
    profile.avoidTopics.length ? `- Avoid: ${profile.avoidTopics.join(", ")}` : null,
    line("Goals", profile.goals),
    line("Other notes", profile.notes),
  ].filter(Boolean).join("\n");

  return [
    `You are a YouTube content strategist. Today is ${today}.`,
    `Your job: research what is trending RIGHT NOW in the creator's niche and propose ${count} video ideas that fit the creator below.`,
    "",
    "## The creator",
    creator,
    focus && focus.trim() ? `\n## Focus for this run\n${focus.trim()}` : "",
    "",
    "## Research steps (use your tools; do not guess)",
    "1. Run at least 4 distinct web searches for what is trending in the niche in the last 14 days: news, product launches, viral discussions, questions people are asking, competitor videos doing well.",
    followed.length
      ? `2. Read these blogs the creator follows and extract fresh angles:\n${followed.map(src).join("\n")}`
      : "2. (No followed blogs were given; rely on search.)",
    mine.length
      ? `3. Read the creator's OWN blogs to learn their voice and what they have already covered. Do NOT repeat topics already covered; build on them.\n${mine.map(src).join("\n")}`
      : "3. (No own blogs were given; infer voice from the profile.)",
    `4. Produce exactly ${count} ideas. Each idea must be tied to at least one real, current source you actually found (URL). Mix safe bets and 1-2 bolder swings.`,
    "",
    "## Output",
    "Return ONLY a JSON object, no prose and no markdown fences, with this shape:",
    '{"ideas":[{"title":"...","altTitles":["..."],"hook":"first 15 seconds, one or two sentences","angle":"what makes this different","format":"one of ' +
      IDEA_FORMAT.join("|") +
      '","outline":["5 to 7 beats"],"thumbnailConcept":"...","tags":["..."],"whyNow":"the trend evidence in one or two sentences","confidence":0-100,"evidence":[{"url":"https://...","title":"...","snippet":"..."}]}]}',
    "confidence = how likely this idea performs for THIS creator this month (integer 0-100).",
  ]
    .filter((s) => s !== null)
    .join("\n");
}
