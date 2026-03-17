/**
 * MCP Server: Model Preferences Demo
 *
 * Reference implementation for SEP: Model Preferences for Tools.
 * Demonstrates how servers can signal model capability preferences
 * per tool via _meta on tool definitions (visible in tools/list).
 *
 * Three tools with different complexity profiles:
 *   list_items     — simple list, favors speed/cost
 *   summarize_data — moderate analysis, balanced
 *   deep_analysis  — complex reasoning, favors intelligence
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tools, META_KEY } from "./tools.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "model-preferences-demo",
    version: "1.0.0",
  });

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.schema,
        annotations: { readOnlyHint: true, openWorldHint: false },
        _meta: {
          [META_KEY]: tool.modelPreferences,
        },
      },
      async (args) => tool.handler(args),
    );
  }

  return server;
}

// Start server when run directly
const server = createServer();
const transport = new StdioServerTransport();
await server.connect(transport);
