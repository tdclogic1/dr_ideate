import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { OWNER_KEY } from "./lib/owner";
import { ideaInput } from "./lib/validators";

export type RunContext = { run: Doc<"researchRuns"> | null; profile: Doc<"profiles"> | null; sources: Doc<"sources">[] };

export const list = query({
  args: {},
  handler: async (ctx) =>
    ctx.db.query("researchRuns").withIndex("by_owner_createdAt", (q) => q.eq("ownerKey", OWNER_KEY)).order("desc").take(20),
});

export const start = mutation({
  args: { focus: v.optional(v.string()) },
  handler: async (ctx, args): Promise<Id<"researchRuns">> => {
    for (const status of ["queued", "running"] as const) {
      const active = await ctx.db
        .query("researchRuns")
        .withIndex("by_owner_status", (q) => q.eq("ownerKey", OWNER_KEY).eq("status", status))
        .first();
      // A run stuck for more than 10 minutes is treated as dead rather than blocking forever.
      if (active && Date.now() - active.updatedAt < 10 * 60 * 1000) throw new Error("A research run is already in progress — wait for it to finish.");
      if (active) await ctx.db.patch(active._id, { status: "failed", error: "timed out", finishedAt: Date.now(), updatedAt: Date.now() });
    }
    const profile = await ctx.db.query("profiles").withIndex("by_owner", (q) => q.eq("ownerKey", OWNER_KEY)).first();
    if (!profile) throw new Error("Set your preferences first so the research knows your niche.");
    const now = Date.now();
    const runId = await ctx.db.insert("researchRuns", {
      ownerKey: OWNER_KEY,
      status: "queued",
      focus: args.focus?.trim() || undefined,
      ideaCount: 0,
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.research.execute, { runId });
    return runId;
  },
});

export const loadContext = internalQuery({
  args: { runId: v.id("researchRuns") },
  handler: async (ctx, { runId }): Promise<RunContext> => {
    const run = await ctx.db.get(runId);
    const profile = await ctx.db.query("profiles").withIndex("by_owner", (q) => q.eq("ownerKey", OWNER_KEY)).first();
    const sources = await ctx.db.query("sources").withIndex("by_owner", (q) => q.eq("ownerKey", OWNER_KEY)).take(100);
    return { run, profile, sources };
  },
});

export const markRunning = internalMutation({
  args: { runId: v.id("researchRuns"), agentKey: v.string() },
  handler: async (ctx, { runId, agentKey }) => {
    const run = await ctx.db.get(runId);
    if (!run) return;
    const now = Date.now();
    await ctx.db.patch(runId, { status: "running", attempts: run.attempts + 1, agentKey, startedAt: now, updatedAt: now });
  },
});

export const complete = internalMutation({
  args: { runId: v.id("researchRuns"), ideas: v.array(ideaInput), model: v.optional(v.string()), problems: v.array(v.string()) },
  handler: async (ctx, { runId, ideas, model, problems }) => {
    const now = Date.now();
    for (const idea of ideas) {
      const { evidence, ...rest } = idea;
      const ideaId = await ctx.db.insert("ideas", { ownerKey: OWNER_KEY, runId, ...rest, createdAt: now, updatedAt: now });
      for (const e of evidence) await ctx.db.insert("ideaEvidence", { ownerKey: OWNER_KEY, ideaId, ...e, createdAt: now });
    }
    await ctx.db.patch(runId, {
      status: "done",
      ideaCount: ideas.length,
      model,
      warning: problems.length ? problems.join("; ") : undefined,
      finishedAt: now,
      updatedAt: now,
    });
  },
});

export const fail = internalMutation({
  args: { runId: v.id("researchRuns"), error: v.string() },
  handler: async (ctx, { runId, error }) => {
    const now = Date.now();
    await ctx.db.patch(runId, { status: "failed", error, finishedAt: now, updatedAt: now });
  },
});
