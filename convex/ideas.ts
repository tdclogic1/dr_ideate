import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { OWNER_KEY } from "./lib/owner";

export type IdeaView = Doc<"ideas"> & { favorite: Doc<"favorites"> | null; evidence: Doc<"ideaEvidence">[] };

async function decorate(ctx: { db: import("./_generated/server").DatabaseReader }, idea: Doc<"ideas">): Promise<IdeaView> {
  const favorite = await ctx.db
    .query("favorites")
    .withIndex("by_owner_idea", (q) => q.eq("ownerKey", OWNER_KEY).eq("ideaId", idea._id))
    .first();
  const evidence = await ctx.db.query("ideaEvidence").withIndex("by_idea", (q) => q.eq("ideaId", idea._id)).take(10);
  return { ...idea, favorite, evidence };
}

export const list = query({
  args: { runId: v.optional(v.id("researchRuns")) },
  handler: async (ctx, { runId }): Promise<IdeaView[]> => {
    const rows = runId
      ? await ctx.db.query("ideas").withIndex("by_run", (q) => q.eq("runId", runId)).order("desc").take(60)
      : await ctx.db.query("ideas").withIndex("by_owner_createdAt", (q) => q.eq("ownerKey", OWNER_KEY)).order("desc").take(60);
    const out: IdeaView[] = [];
    for (const r of rows) out.push(await decorate(ctx, r));
    return out;
  },
});

export const favorites = query({
  args: {},
  handler: async (ctx): Promise<IdeaView[]> => {
    const favs = await ctx.db
      .query("favorites")
      .withIndex("by_owner_createdAt", (q) => q.eq("ownerKey", OWNER_KEY))
      .order("desc")
      .take(100);
    const out: IdeaView[] = [];
    for (const f of favs) {
      const idea = await ctx.db.get(f.ideaId);
      if (idea) out.push(await decorate(ctx, idea));
    }
    return out;
  },
});

export const toggleFavorite = mutation({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, { ideaId }): Promise<boolean> => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_owner_idea", (q) => q.eq("ownerKey", OWNER_KEY).eq("ideaId", ideaId))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    const idea = await ctx.db.get(ideaId);
    if (!idea || idea.ownerKey !== OWNER_KEY) throw new Error("That idea no longer exists.");
    const now = Date.now();
    await ctx.db.insert("favorites", { ownerKey: OWNER_KEY, ideaId, createdAt: now, updatedAt: now });
    return true;
  },
});

export const setFavoriteNote = mutation({
  args: { ideaId: v.id("ideas"), note: v.string() },
  handler: async (ctx, { ideaId, note }) => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_owner_idea", (q) => q.eq("ownerKey", OWNER_KEY).eq("ideaId", ideaId))
      .first();
    if (!existing) throw new Error("Star the idea before adding a note.");
    await ctx.db.patch(existing._id, { note: note.trim() || undefined, updatedAt: Date.now() });
  },
});
