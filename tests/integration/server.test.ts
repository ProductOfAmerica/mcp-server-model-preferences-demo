import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "../../src/index.js";
import { META_KEY } from "../../src/tools.js";

describe("MCP server via InMemoryTransport", () => {
  let client: Client;
  let clientTransport: InstanceType<typeof InMemoryTransport>;
  let serverTransport: InstanceType<typeof InMemoryTransport>;

  beforeEach(async () => {
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    const server = createServer();
    await server.connect(serverTransport);

    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
  });

  // --------------------------------------------------------------------------
  // Protocol
  // --------------------------------------------------------------------------

  describe("protocol", () => {
    it("server identifies itself correctly", () => {
      const info = client.getServerVersion();
      expect(info?.name).toBe("model-preferences-demo");
      expect(info?.version).toBe("1.0.0");
    });

    it("server advertises tools capability", () => {
      const capabilities = client.getServerCapabilities();
      expect(capabilities?.tools).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // Discovery (tools/list)
  // --------------------------------------------------------------------------

  describe("tools/list", () => {
    it("returns exactly 3 tools", async () => {
      const { tools } = await client.listTools();
      expect(tools).toHaveLength(3);
    });

    it("each tool has name, description, and inputSchema", async () => {
      const { tools } = await client.listTools();
      for (const tool of tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
      }
    });

    it("returns expected tool names", async () => {
      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name).sort();
      expect(names).toEqual(["deep_analysis", "list_items", "summarize_data"]);
    });

    it("each tool has annotations", async () => {
      const { tools } = await client.listTools();
      for (const tool of tools) {
        expect(tool.annotations?.readOnlyHint).toBe(true);
        expect(tool.annotations?.openWorldHint).toBe(false);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Tool execution (tools/call)
  // --------------------------------------------------------------------------

  describe("tools/call", () => {
    it("list_items returns parseable JSON array", async () => {
      const result = await client.callTool({
        name: "list_items",
        arguments: {},
      });
      expect(result.content).toBeInstanceOf(Array);
      const text = (result.content[0] as { type: string; text: string }).text;
      const parsed = JSON.parse(text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });

    it("summarize_data returns summary object", async () => {
      const result = await client.callTool({
        name: "summarize_data",
        arguments: { dataset: "test" },
      });
      const text = (result.content[0] as { type: string; text: string }).text;
      const parsed = JSON.parse(text);
      expect(parsed.summary).toBeDefined();
      expect(parsed.trends).toBeInstanceOf(Array);
    });

    it("deep_analysis returns diagnosis object", async () => {
      const result = await client.callTool({
        name: "deep_analysis",
        arguments: { subject: "test" },
      });
      const text = (result.content[0] as { type: string; text: string }).text;
      const parsed = JSON.parse(text);
      expect(parsed.diagnosis).toBeDefined();
      expect(parsed.recommendations).toBeInstanceOf(Array);
    });

    it("deep_analysis accepts optional depth argument", async () => {
      const result = await client.callTool({
        name: "deep_analysis",
        arguments: { subject: "test", depth: "comprehensive" },
      });
      expect(result.isError).toBeFalsy();
    });

    it("list_items works with optional category argument", async () => {
      const result = await client.callTool({
        name: "list_items",
        arguments: { category: "tools" },
      });
      expect(result.isError).toBeFalsy();
    });
  });

  // --------------------------------------------------------------------------
  // Error cases
  // --------------------------------------------------------------------------

  describe("error handling", () => {
    it("returns isError for nonexistent tools", async () => {
      const result = await client.callTool({
        name: "nonexistent",
        arguments: {},
      });
      expect(result.isError).toBe(true);
    });

    it("returns isError for summarize_data without required dataset arg", async () => {
      const result = await client.callTool({
        name: "summarize_data",
        arguments: {},
      });
      expect(result.isError).toBe(true);
    });

    it("returns isError for deep_analysis without required subject arg", async () => {
      const result = await client.callTool({
        name: "deep_analysis",
        arguments: {},
      });
      expect(result.isError).toBe(true);
    });

    it("returns isError for deep_analysis with invalid depth enum value", async () => {
      const result = await client.callTool({
        name: "deep_analysis",
        arguments: { subject: "test", depth: "invalid" },
      });
      expect(result.isError).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Model preferences on tool definitions (tools/list _meta)
  // --------------------------------------------------------------------------

  describe("model preferences on tool definitions", () => {
    it("each tool definition includes _meta with model preferences", async () => {
      const { tools } = await client.listTools();
      for (const tool of tools) {
        const meta = tool._meta as Record<string, unknown> | undefined;
        expect(meta).toBeDefined();
        expect(meta![META_KEY]).toBeDefined();
      }
    });

    it("list_items definition has cost/speed-optimized preferences", async () => {
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === "list_items")!;
      const prefs = (tool._meta as Record<string, Record<string, number>>)[META_KEY];
      expect(prefs.intelligencePriority).toBe(0.1);
      expect(prefs.costPriority).toBe(0.9);
      expect(prefs.speedPriority).toBe(0.8);
    });

    it("summarize_data definition has balanced preferences", async () => {
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === "summarize_data")!;
      const prefs = (tool._meta as Record<string, Record<string, number>>)[META_KEY];
      expect(prefs.intelligencePriority).toBe(0.5);
      expect(prefs.costPriority).toBe(0.5);
      expect(prefs.speedPriority).toBe(0.5);
    });

    it("deep_analysis definition has high intelligence preference", async () => {
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === "deep_analysis")!;
      const prefs = (tool._meta as Record<string, Record<string, number>>)[META_KEY];
      expect(prefs.intelligencePriority).toBe(0.9);
      expect(prefs.costPriority).toBe(0.2);
      expect(prefs.speedPriority).toBe(0.3);
    });

    it("preferences are available before calling any tool", async () => {
      // This is the key test: clients can route models based on
      // tool definitions without making a single tool call first
      const { tools } = await client.listTools();
      const prefsMap = new Map(
        tools.map((t) => [
          t.name,
          (t._meta as Record<string, Record<string, number>>)[META_KEY],
        ]),
      );

      // A client could use this to decide: use Haiku for list_items, Opus for deep_analysis
      expect(prefsMap.get("list_items")!.costPriority).toBeGreaterThan(
        prefsMap.get("deep_analysis")!.costPriority,
      );
      expect(prefsMap.get("deep_analysis")!.intelligencePriority).toBeGreaterThan(
        prefsMap.get("list_items")!.intelligencePriority,
      );
    });
  });
});
