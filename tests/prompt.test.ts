import { describe, expect, it } from "vitest";
import { IDEAS_PER_RUN, buildResearchPrompt, type ProfileInput, type SourceInput } from "../convex/lib/prompt";

const profile: ProfileInput = {
  channelName: "Tool Teardowns",
  niche: "practical AI tools for small-business owners",
  audience: "owner-operators with no engineering team",
  tone: "direct, no hype",
  formats: ["long-form", "short"],
  avoidTopics: ["crypto", "politics"],
  goals: "grow to 10k subs",
};
const sources: SourceInput[] = [
  { url: "https://me.example/blog", title: "My blog", kind: "mine" },
  { url: "https://they.example/feed", kind: "followed", notes: "only the AI category" },
];

describe("buildResearchPrompt", () => {
  it("carries every profile field the creator filled in", () => {
    const p = buildResearchPrompt(profile, sources, undefined, IDEAS_PER_RUN, "2026-11-08");
    expect(p).toContain("Today is 2026-11-08.");
    expect(p).toContain("- Channel: Tool Teardowns");
    expect(p).toContain("- Niche / topics: practical AI tools for small-business owners");
    expect(p).toContain("- Audience: owner-operators with no engineering team");
    expect(p).toContain("- Tone: direct, no hype");
    expect(p).toContain("- Preferred formats: long-form, short");
    expect(p).toContain("- Avoid: crypto, politics");
    expect(p).toContain("- Goals: grow to 10k subs");
    expect(p).not.toContain("Other notes");
  });

  it("separates own blogs from followed blogs and asks for exactly N ideas", () => {
    const p = buildResearchPrompt(profile, sources, undefined, 5, "2026-11-08");
    expect(p).toContain("Read these blogs the creator follows");
    expect(p).toContain("- https://they.example/feed — only the AI category");
    expect(p).toContain("Read the creator's OWN blogs");
    expect(p).toContain("- https://me.example/blog (My blog)");
    expect(p).toContain("Produce exactly 5 ideas.");
    expect(p).toContain("propose 5 video ideas");
  });

  it("degrades honestly with no sources and includes the run focus", () => {
    const p = buildResearchPrompt({ niche: "woodworking", formats: [], avoidTopics: [] }, [], "shorts only", 8, "2026-11-08");
    expect(p).toContain("(No followed blogs were given; rely on search.)");
    expect(p).toContain("(No own blogs were given; infer voice from the profile.)");
    expect(p).toContain("## Focus for this run\nshorts only");
    expect(p).not.toContain("Preferred formats");
    expect(p).not.toContain("Avoid:");
  });

  it("asks for JSON only and lists every declared format", () => {
    const p = buildResearchPrompt(profile, [], undefined, 8, "2026-11-08");
    expect(p).toContain("Return ONLY a JSON object");
    expect(p).toContain("long-form|short|tutorial|review|listicle|vlog|live|essay|other");
  });
});
