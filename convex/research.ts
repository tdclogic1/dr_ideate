// The research run: ONE gateway dispatch with web tools, parsed into idea rows.
// All AI goes through the 2030 gateway (POST /v1/agents/dispatch) with the key
// from Convex env — never a provider call, never a key in this repo.
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { gatewayRequest } from "./lib/gateway";
import { platformStatus } from "./lib/platformStatus";
import { OWNER_KEY } from "./lib/owner";
import { parseIdeas } from "./lib/ideas";
import { DEFAULT_AGENT_KEY, DEFAULT_MAX_TOKENS, DEFAULT_SKILL, IDEA_OUTPUT_SCHEMA, buildResearchPrompt } from "./lib/prompt";
import type { RunContext } from "./runs";

type DispatchReply = { ok?: boolean; reason?: string; output?: unknown; model?: string; stub?: boolean };

export const execute = internalAction({
  args: { runId: v.id("researchRuns") },
  handler: async (ctx, { runId }) => {
    const fail = (error: string) => ctx.runMutation(internal.runs.fail, { runId, error });
    const c: RunContext = await ctx.runQuery(internal.runs.loadContext, { runId });
    if (!c.run) return;
    if (!c.profile) return fail("No preferences saved yet.");

    const agentKey = process.env.IDEATE_AGENT_KEY ?? DEFAULT_AGENT_KEY;
    const skill = process.env.IDEATE_SKILL ?? DEFAULT_SKILL;
    const maxTokens = Number(process.env.IDEATE_MAX_TOKENS ?? DEFAULT_MAX_TOKENS);
    await ctx.runMutation(internal.runs.markRunning, { runId, agentKey });

    const base = process.env.PLATFORM_API_URL;
    const key = process.env.PLATFORM_SERVICE_KEY;
    const status = platformStatus(base, key);
    if (!status.connected) return fail(`${status.message}. Set PLATFORM_API_URL and PLATFORM_SERVICE_KEY with \`npx convex env set\`.`);

    try {
      const prompt = buildResearchPrompt(c.profile, c.sources, c.run.focus);
      const r = await gatewayRequest(base!, key!, "POST", "/v1/agents/dispatch", {
        agentKey,
        skill,
        input: prompt,
        maxTokens,
        tools: ["web_search", "web_scrape"],
        outputSchema: IDEA_OUTPUT_SCHEMA,
        subject: OWNER_KEY,
      });
      if (!r.ok) return fail(r.error);
      const d = r.data as DispatchReply;
      if (d.ok === false) return fail(`dispatch refused: ${d.reason ?? "no reason given"} (is ${agentKey} registered for this key?)`);
      if (d.stub) return fail("the gateway returned a stub reply — the platform rail is not fully provisioned");
      const text = typeof d.output === "string" ? d.output : JSON.stringify(d.output ?? "");
      if (!text.trim()) return fail(`${agentKey} returned an empty reply`);
      const parsed = parseIdeas(text);
      if (parsed.ideas.length === 0) return fail(`no ideas could be read from the reply: ${parsed.problems.join("; ")}`);
      await ctx.runMutation(internal.runs.complete, { runId, ideas: parsed.ideas, model: d.model, problems: parsed.problems });
    } catch (e) {
      await fail(e instanceof Error ? e.message : String(e));
    }
  },
});
