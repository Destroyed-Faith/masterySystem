import { describe, expect, it } from "vitest";
import { getAttackAttributeForPowerTreeOrSchool } from "../src/utils/power-roll-attribute";

describe("getAttackAttributeForPowerTreeOrSchool", () => {
  it("maps mastery trees", () => {
    expect(getAttackAttributeForPowerTreeOrSchool("Crusader")).toBe("might");
    expect(getAttackAttributeForPowerTreeOrSchool("Grim Hunter")).toBe("agility");
    expect(getAttackAttributeForPowerTreeOrSchool("Mesmer")).toBe("influence");
    expect(getAttackAttributeForPowerTreeOrSchool("Catalyst")).toBe("vitality");
  });

  it("maps spell schools", () => {
    expect(getAttackAttributeForPowerTreeOrSchool("Pyromancy")).toBe("intellect");
    expect(getAttackAttributeForPowerTreeOrSchool("Thorn & Whisper")).toBe("resolve");
    expect(getAttackAttributeForPowerTreeOrSchool("Aegis & Benedictions")).toBe("resolve");
  });

  it("returns null for unknown or empty", () => {
    expect(getAttackAttributeForPowerTreeOrSchool("")).toBeNull();
    expect(getAttackAttributeForPowerTreeOrSchool("Werewolf")).toBeNull();
    expect(getAttackAttributeForPowerTreeOrSchool(null)).toBeNull();
  });
});
