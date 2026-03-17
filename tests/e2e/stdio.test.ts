import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { META_KEY } from "../../src/tools.js";

describe("MCP server via stdio (E2E)", () => {
  let client: Client;
  let transport: InstanceType<typeof StdioClientTransport>;

  beforeEach(async () => {
    transport = new StdioClientTransport({
      command: "npx",
      args: ["tsx", "src/index.ts"],
      cwd: "/tmp/mcp-server-model-preferences-demo",
      stderr: "pipe",
    });

    client = new Client({ name: "e2e-test-client", version: "1.0.0" });
    await client.connect(transport);
  });

  afterEach(async () => {
    await client.close();
  });

  it("server starts and accepts connection", () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe("model-preferences-demo");
  });

  it("lists 3 tools over stdio", async () => {
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(3);
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(["deep_analysis", "list_items", "summarize_data"]);
  });

  it("tool definitions include model preferences in _meta", async () => {
    const { tools } = await client.listTools();
    const deepAnalysis = tools.find((t) => t.name === "deep_analysis")!;
    const meta = deepAnalysis._meta as Record<string, Record<string, number>>;
    expect(meta).toBeDefined();
    expect(meta[META_KEY].intelligencePriority).toBe(0.9);
  });

  it("calls list_items and returns valid response", async () => {
    const result = await client.callTool({
      name: "list_items",
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(text);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it("server process exits cleanly when client disconnects", async () => {
    // client.close() in afterEach sends shutdown — verify no error
    await client.close();
    // Re-create client so afterEach doesn't double-close
    client = new Client({ name: "e2e-noop", version: "1.0.0" });
  });
});
