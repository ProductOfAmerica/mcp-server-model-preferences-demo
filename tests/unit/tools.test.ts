import { describe, expect, it } from "vitest";
import { tools } from "../../src/tools.js";

function isValidPriority(n: number): boolean {
  return typeof n === "number" && n >= 0 && n <= 1;
}

describe("tool definitions", () => {
  it("exports exactly 3 tools", () => {
    expect(tools).toHaveLength(3);
  });

  it("each tool has a unique name", () => {
    const names = tools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  for (const tool of tools) {
    describe(tool.name, () => {
      it("has a non-empty description", () => {
        expect(tool.description.length).toBeGreaterThan(0);
      });

      it("has a schema object", () => {
        expect(tool.schema).toBeDefined();
        expect(typeof tool.schema).toBe("object");
      });

      it("has modelPreferences with valid priority values", () => {
        const prefs = tool.modelPreferences;
        expect(isValidPriority(prefs.intelligencePriority)).toBe(true);
        expect(isValidPriority(prefs.costPriority)).toBe(true);
        expect(isValidPriority(prefs.speedPriority)).toBe(true);
      });
    });
  }
});

describe("tool handlers", () => {
  for (const tool of tools) {
    describe(tool.name, () => {
      it("returns valid content structure", async () => {
        const result = await tool.handler({});
        expect(result.content).toBeInstanceOf(Array);
        expect(result.content.length).toBeGreaterThan(0);
        expect(result.content[0].type).toBe("text");
        expect(typeof result.content[0].text).toBe("string");
      });

      it("returns parseable JSON content", async () => {
        const result = await tool.handler({});
        expect(() => JSON.parse(result.content[0].text)).not.toThrow();
      });
    });
  }
});

describe("model preference differentiation", () => {
  it("list_items favors cost and speed over intelligence", () => {
    const prefs = tools.find((t) => t.name === "list_items")!.modelPreferences;
    expect(prefs.costPriority).toBeGreaterThan(prefs.intelligencePriority);
    expect(prefs.speedPriority).toBeGreaterThan(prefs.intelligencePriority);
  });

  it("summarize_data has balanced priorities", () => {
    const prefs = tools.find(
      (t) => t.name === "summarize_data",
    )!.modelPreferences;
    expect(prefs.intelligencePriority).toBe(0.5);
    expect(prefs.costPriority).toBe(0.5);
    expect(prefs.speedPriority).toBe(0.5);
  });

  it("deep_analysis favors intelligence over cost and speed", () => {
    const prefs = tools.find(
      (t) => t.name === "deep_analysis",
    )!.modelPreferences;
    expect(prefs.intelligencePriority).toBeGreaterThan(prefs.costPriority);
    expect(prefs.intelligencePriority).toBeGreaterThan(prefs.speedPriority);
  });

  it("each tool has a distinct preference profile", () => {
    const profiles = tools.map(
      (t) =>
        `${t.modelPreferences.intelligencePriority}-${t.modelPreferences.costPriority}-${t.modelPreferences.speedPriority}`,
    );
    expect(new Set(profiles).size).toBe(profiles.length);
  });
});
