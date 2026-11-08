import { describe, expect, it } from "vitest";
import { clampConfidence, extractJson, normalizeFormat, parseIdeas } from "../convex/lib/ideas";

const good = {
  title: "I replaced my bookkeeper with three AI tools",
  altTitles: ["3 AI tools that do my books"],
  hook: "Last month my books closed themselves.",
  angle: "Owner-operator, not accountant",
  format: "long-form",
  outline: ["the problem", "tool 1", "tool 2", "tool 3", "what broke"],
  thumbnailConcept: "Receipt pile vs clean dashboard",
  tags: ["ai", "bookkeeping"],
  whyNow: "Two launches this week.",
  confidence: 72,
  evidence: [{ url: "https://news.example/launch", title: "Launch post", snippet: "shipped Tuesday" }],
};

describe("extractJson", () => {
  it("strips markdown fences and prose around the object", () => {
    expect(extractJson('Here you go:\n```json\n{"a":1}\n```\nThanks')).toBe('{"a":1}');
  });
  it("returns null when there is no object", () => {
    expect(extractJson("no json here")).toBeNull();
  });
});

describe("normalizeFormat / clampConfidence", () => {
  it("maps loose format names onto the declared enum", () => {
    expect(normalizeFormat("Long Form")).toBe("long-form");
    expect(normalizeFormat("Shorts")).toBe("short");
    expect(normalizeFormat("tutorial")).toBe("tutorial");
    expect(normalizeFormat("podcast")).toBe("other");
    expect(normalizeFormat(undefined)).toBe("other");
  });
  it("clamps confidence to an integer 0-100 and defaults to 50", () => {
    expect(clampConfidence(150)).toBe(100);
    expect(clampConfidence(-3)).toBe(0);
    expect(clampConfidence(42.6)).toBe(43);
    expect(clampConfidence("88")).toBe(88);
    expect(clampConfidence("high")).toBe(50);
  });
});

describe("parseIdeas", () => {
  it("parses a fenced reply into typed ideas with evidence", () => {
    const r = parseIdeas("```json\n" + JSON.stringify({ ideas: [good] }) + "\n```");
    expect(r.problems).toEqual([]);
    expect(r.ideas).toHaveLength(1);
    expect(r.ideas[0]).toEqual(good);
  });

  it("accepts a bare top-level array", () => {
    const r = parseIdeas(JSON.stringify([good, good]));
    expect(r.ideas).toHaveLength(2);
  });

  it("drops ideas with no title or hook and says which", () => {
    const r = parseIdeas(JSON.stringify({ ideas: [{ ...good, hook: "" }, { ...good, title: undefined }, good] }));
    expect(r.ideas).toHaveLength(1);
    expect(r.problems).toEqual(["idea 1 dropped: missing hook", "idea 2 dropped: missing title"]);
  });

  it("filters non-http evidence and flags ideas left with none", () => {
    const r = parseIdeas(JSON.stringify({ ideas: [{ ...good, evidence: [{ url: "javascript:alert(1)" }, { url: "not a url" }] }] }));
    expect(r.ideas[0].evidence).toEqual([]);
    expect(r.problems).toEqual([`idea 1 ("${good.title}") has no usable evidence URL`]);
  });

  it("tolerates missing optional fields and odd types", () => {
    const r = parseIdeas(JSON.stringify({ ideas: [{ title: "T", hook: "H", format: "Weird", confidence: "95", outline: "not a list", tags: [1, "ok"] }] }));
    expect(r.ideas[0]).toMatchObject({ title: "T", hook: "H", format: "other", confidence: 95, outline: [], tags: ["ok"], altTitles: [], angle: "", whyNow: "" });
    expect(r.ideas[0].thumbnailConcept).toBeUndefined();
  });

  it("reports unparseable replies without throwing", () => {
    expect(parseIdeas("The model refused.")).toEqual({ ideas: [], problems: ["reply contained no JSON object"] });
    expect(parseIdeas("{ideas: [}").problems[0]).toMatch(/did not parse/);
    expect(parseIdeas('{"foo":1}')).toEqual({ ideas: [], problems: ["reply had no `ideas` array"] });
  });
});
