# MCP Server: Model Preferences Demo

Reference implementation for [SEP: Model Preferences for Tools](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/TBD) — a proposal to add `modelPreferences` to MCP tool annotations, allowing servers to signal what model capability level best suits each tool.

## What This Demonstrates

This server exposes three tools with different complexity profiles. Each tool includes model preference hints via `_meta`, signaling to clients whether the tool's output benefits from a fast/cheap model or a more capable one:

| Tool | Intelligence | Cost | Speed | Rationale |
|------|-------------|------|-------|-----------|
| `list_items` | 0.1 | 0.9 | 0.8 | Simple list — any model handles it |
| `summarize_data` | 0.5 | 0.5 | 0.5 | Moderate analysis — balanced |
| `deep_analysis` | 0.9 | 0.2 | 0.3 | Complex reasoning with evidence chains |

## Running

```bash
npm install
npm start
```

The server uses stdio transport. Connect with the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) or any MCP client.

## Current vs Proposed Format

This demo uses `_meta` because the SDK doesn't yet support `modelPreferences` in `ToolAnnotations`. The SEP proposes adding it as a first-class annotation field.

**Current (this demo) — via `_meta`:**
```json
{
  "name": "deep_analysis",
  "description": "...",
  "inputSchema": { ... },
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
  "description": "...",
  "inputSchema": { ... },
  "annotations": {
    "readOnlyHint": true,
    "title": "Deep Analysis",
    "modelPreferences": {
      "intelligencePriority": 0.9,
      "costPriority": 0.2,
      "speedPriority": 0.3
    }
  }
}
```

The `modelPreferences` type already exists in the MCP spec for [sampling](https://modelcontextprotocol.io/specification/2025-06-18/server/sampling). This proposal reuses it for tool annotations — same dimensions (intelligence, cost, speed), same 0.0–1.0 scale.

## License

MIT
