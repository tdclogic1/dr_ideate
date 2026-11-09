"use node";
// The research run: one Claude call with web search + web fetch, parsed into idea rows.
// Bring your own key: the browser sends the Anthropic API key with each run. It is held
// in this action's memory only — never written to the database or to this repo.
// ANTHROPIC_API_KEY on the Convex deployment is an optional fallback for a private deploy.
import Anthropic from "@anthropic-ai/sdk";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { parseIdeas } from "./lib/ideas";
import { DEFAULT_EFFORT, DEFAULT_MODEL, buildResearchPrompt, type Effort, isEffort } from "./lib/prompt";
import type { RunContext } from "./runs";

const SYSTEM =
  "You are a YouTube content strategist who researches before recommending. Use web search to find what is current, and web fetch to read the creator's sources. Reply with the JSON object requested and nothing else.";

export const start = action({
  args: { apiKey: v.string(), focus: v.optional(v.string()) },
  handler: async (ctx, { apiKey, focus }): Promise<null> => {
    // Explicit return types break the type cycle runs.ts → api → research.ts → runs.ts.
    const runId: Id<"researchRuns"> = await ctx.runMutation(internal.runs.start, { focus });
    const fail = async (error: string): Promise<null> => {
      await ctx.runMutation(internal.runs.fail, { runId, error });
      return null;
    };
    const c: RunContext = await ctx.runQuery(internal.runs.loadContext, { runId });
    if (!c.run) return null;
    if (!c.profile) return fail("No preferences saved yet.");

    const model = process.env.IDEATE_MODEL ?? DEFAULT_MODEL;
    const effortEnv = process.env.IDEATE_EFFORT;
    const effort: Effort = effortEnv && isEffort(effortEnv) ? effortEnv : DEFAULT_EFFORT;
    await ctx.runMutation(internal.runs.markRunning, { runId, model });

    const key = apiKey.trim() || process.env.ANTHROPIC_API_KEY;
    if (!key) return fail("No API key. Paste your Anthropic API key above and run again.");
    const client = new Anthropic({ apiKey: key });

    try {
      const prompt = buildResearchPrompt(c.profile, c.sources, c.run.focus);
      const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: prompt }];
      let message: Anthropic.Beta.BetaMessage;
      // Server tools can pause a long turn (stop_reason "pause_turn"); resume until the model finishes.
      for (let turn = 0; ; turn++) {
        message = await client.beta.messages
          .stream({
            model,
            max_tokens: 16000,
            system: SYSTEM,
            output_config: { effort },
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            tools: [
              { type: "web_search_20260209", name: "web_search", max_uses: 8 },
              { type: "web_fetch_20260209", name: "web_fetch", max_uses: 6, max_content_tokens: 20000 },
            ],
            messages,
          })
          .finalMessage();
        if (message.stop_reason !== "pause_turn" || turn >= 4) break;
        messages.push({ role: "assistant", content: message.content });
      }

      if (message.stop_reason === "refusal") {
        const why = message.stop_details?.explanation ?? message.stop_details?.category ?? "no reason given";
        return fail(`the model declined this request: ${why}`);
      }
      if (message.stop_reason === "max_tokens") return fail("the reply was cut off at the token limit; try a narrower focus");

      const text = message.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      if (!text.trim()) return fail("the model returned no text");
      const parsed = parseIdeas(text);
      if (parsed.ideas.length === 0) return fail(`no ideas could be read from the reply: ${parsed.problems.join("; ")}`);
      await ctx.runMutation(internal.runs.complete, { runId, ideas: parsed.ideas, model: message.model, problems: parsed.problems });
      return null;
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) return fail("the API key was rejected — check it and try again");
      if (e instanceof Anthropic.RateLimitError) return fail("rate limited by the API — try again in a minute");
      if (e instanceof Anthropic.APIError) return fail(`API error ${e.status ?? ""}: ${e.message}`.trim());
      return fail(e instanceof Error ? e.message : String(e));
    }
  },
});
