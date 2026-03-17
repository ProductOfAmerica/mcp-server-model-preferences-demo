/**
 * MCP Server: Model Preferences Demo
 *
 * Reference implementation for SEP: Model Preferences for Tools.
 * Demonstrates how servers can signal model capability preferences
 * per tool using _meta (forward-compatible with proposed annotations).
 *
 * Three tools with different complexity profiles:
 *   list_items     — simple list, favors speed/cost
 *   summarize_data — moderate analysis, balanced
 *   deep_analysis  — complex reasoning, favors intelligence
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "model-preferences-demo",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Tool 1: Simple list — any model handles this fine
// ---------------------------------------------------------------------------

server.tool(
  "list_items",
  "Returns a flat list of item names. Simple structured data.",
  { category: z.string().optional().describe("Filter by category") },
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify([
          { id: 1, name: "Item A", category: "tools" },
          { id: 2, name: "Item B", category: "parts" },
          { id: 3, name: "Item C", category: "tools" },
        ]),
      },
    ],
    _meta: {
      "com.example/model-preferences": {
        intelligencePriority: 0.1,
        costPriority: 0.9,
        speedPriority: 0.8,
      },
    },
  }),
);

// ---------------------------------------------------------------------------
// Tool 2: Moderate analysis — benefits from a mid-tier model
// ---------------------------------------------------------------------------

server.tool(
  "summarize_data",
  "Summarizes data with trend analysis. Moderate reasoning required.",
  { dataset: z.string().describe("Name of the dataset to summarize") },
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify({
          summary: "Revenue increased 12% QoQ driven by enterprise segment.",
          trends: [
            { metric: "revenue", direction: "up", magnitude: "12%" },
            { metric: "churn", direction: "down", magnitude: "3%" },
            { metric: "nps", direction: "stable", magnitude: "0" },
          ],
          confidence: 0.85,
          caveats: ["Q4 seasonal effects not isolated"],
        }),
      },
    ],
    _meta: {
      "com.example/model-preferences": {
        intelligencePriority: 0.5,
        costPriority: 0.5,
        speedPriority: 0.5,
      },
    },
  }),
);

// ---------------------------------------------------------------------------
// Tool 3: Complex analysis — benefits from a highly capable model
// ---------------------------------------------------------------------------

server.tool(
  "deep_analysis",
  "Multi-dimensional analysis with evidence chains, statistical modeling, and actionable recommendations. Benefits significantly from advanced reasoning.",
  {
    subject: z.string().describe("Subject of the analysis"),
    depth: z
      .enum(["standard", "comprehensive"])
      .optional()
      .describe("Analysis depth"),
  },
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify({
          diagnosis: {
            primary: "Yield decline correlated with soil pH drift",
            confidence: 0.78,
            evidence: [
              {
                source: "soil_samples",
                finding: "pH dropped from 6.8 to 5.9 over 18 months",
                weight: 0.4,
              },
              {
                source: "yield_history",
                finding: "15% decline in zones overlapping low-pH areas",
                weight: 0.35,
              },
              {
                source: "weather_data",
                finding: "Rainfall 20% above normal — leaching likely",
                weight: 0.25,
              },
            ],
          },
          recommendations: [
            {
              action: "Apply lime at 2 tons/acre in affected zones",
              priority: "high",
              timeframe: "before next planting",
              expectedImpact: "+8-12% yield recovery",
            },
            {
              action: "Install soil moisture sensors for leaching alerts",
              priority: "medium",
              timeframe: "within 60 days",
              expectedImpact: "Prevent recurrence",
            },
          ],
          alternativeHypotheses: [
            {
              hypothesis: "Nutrient depletion from continuous cropping",
              likelihood: 0.3,
              testNeeded: "Tissue analysis next growth stage",
            },
          ],
        }),
      },
    ],
    _meta: {
      "com.example/model-preferences": {
        intelligencePriority: 0.9,
        costPriority: 0.2,
        speedPriority: 0.3,
      },
    },
  }),
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
