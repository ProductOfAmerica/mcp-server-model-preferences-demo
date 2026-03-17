# MCP Server: Model Preferences Demo

Reference implementation for [SEP-2417: Model Preferences for Tools](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2417) — a proposal to add `modelPreferences` to MCP tool annotations, allowing servers to signal what model capability level best suits each tool.

## What This Demonstrates

This server exposes three tools with different complexity profiles. Each tool includes model preference hints via `_meta` **on the tool definition**, so clients can see preferences at discovery time (`tools/list`) — before calling any tool:

| Tool | Intelligence | Cost | Speed | Rationale |
|------|-------------|------|-------|-----------|
| `list_items` | 0.1 | 0.9 | 0.8 | Simple list — any model handles it |
| `summarize_data` | 0.5 | 0.5 | 0.5 | Moderate analysis — balanced |
| `deep_analysis` | 0.9 | 0.2 | 0.3 | Complex reasoning with evidence chains |

A client calling `tools/list` sees the full preference profile for every tool upfront, enabling proactive model routing without calling any tools first.

## Running

```bash
npm install
npm start
```

The server uses stdio transport. Connect with the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) or any MCP client.

## How It Works

The server uses `registerTool()` with `_meta` to attach model preferences to each tool definition:

```typescript
server.registerTool("deep_analysis", {
  description: "Multi-dimensional analysis with evidence chains...",
  inputSchema: { subject: z.string(), depth: z.enum(["standard", "comprehensive"]).optional() },
  annotations: { readOnlyHint: true, openWorldHint: false },
  _meta: {
    "com.example/model-preferences": {
      intelligencePriority: 0.9,
      costPriority: 0.2,
      speedPriority: 0.3,
    },
  },
}, handler);
```

When a client calls `tools/list`, it receives:

```json
{
  "tools": [
    {
      "name": "deep_analysis",
      "description": "...",
      "inputSchema": { "..." },
      "annotations": { "readOnlyHint": true, "openWorldHint": false },
      "_meta": {
        "com.example/model-preferences": {
          "intelligencePriority": 0.9,
          "costPriority": 0.2,
          "speedPriority": 0.3
        }
      }
    }
  ]
}
```

## Current vs Proposed Format

This demo uses `_meta` with a namespaced key because `ToolAnnotations` doesn't yet include `modelPreferences`. The SEP proposes adding it as a first-class annotation field:

**Current (this demo) — via `_meta` on tool definition:**
```json
{
  "name": "deep_analysis",
  "_meta": {
    "com.example/model-preferences": {
      "intelligencePriority": 0.9,
      "costPriority": 0.2,
      "speedPriority": 0.3
    }
  }
}
```

**Proposed (SEP) — via `annotations`:**
```json
{
  "name": "deep_analysis",
  "annotations": {
    "readOnlyHint": true,
    "modelPreferences": {
      "intelligencePriority": 0.9,
      "costPriority": 0.2,
      "speedPriority": 0.3
    }
  }
}
```

The `modelPreferences` type already exists in the MCP spec for [sampling](https://modelcontextprotocol.io/specification/2025-06-18/server/sampling). This proposal reuses it for tool annotations — same dimensions (intelligence, cost, speed), same 0.0-1.0 scale.

## License

MIT
