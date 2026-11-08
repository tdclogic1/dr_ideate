import { describe, expect, it } from "vitest";
import { IDEA_FORMAT, RUN_STATUS, SOURCE_KIND } from "../convex/lib/enums";
import { ideaFormat, runStatus, sourceKind } from "../convex/lib/validators";

const members = (u: { members: { value: unknown }[] }) => u.members.map((m) => m.value);

// The declared enum is the constraint; the schema validator must not drift from it.
describe("schema validators match declared enums", () => {
  it("runStatus", () => expect(members(runStatus)).toEqual([...RUN_STATUS]));
  it("sourceKind", () => expect(members(sourceKind)).toEqual([...SOURCE_KIND]));
  it("ideaFormat", () => expect(members(ideaFormat)).toEqual([...IDEA_FORMAT]));
});
