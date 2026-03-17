/**
 * Tool definitions for the Model Preferences demo server.
 *
 * Each tool has a different complexity profile, reflected in its
 * _meta model preferences. Extracted from index.ts for testability.
 */

import { z } from "zod";

/** Model preference hints (mirrors the proposed ModelPreferences type) */
export interface ModelPreferencesHint {
  intelligencePriority: number;
  costPriority: number;
  speedPriority: number;
}

/** A tool definition with its handler and model preference metadata */
export interface ToolDefinition {
  name: string;
  description: string;
  schema: Record<string, z.ZodType>;
  handler: (args: Record<string, unknown>) => Promise<{
    content: Array<{ type: "text"; text: string }>;
    _meta: { "com.example/model-preferences": ModelPreferencesHint };
  }>;
  modelPreferences: ModelPreferencesHint;
}

// ---------------------------------------------------------------------------
// Tool 1: Simple list — any model handles this fine
// ---------------------------------------------------------------------------

const listItems: ToolDefinition = {
  name: "list_items",
  description: "Returns a flat list of item names. Simple structured data.",
  schema: {
    category: z.string().optional().describe("Filter by category"),
  },
  modelPreferences: {
    intelligencePriority: 0.1,
    costPriority: 0.9,
    speedPriority: 0.8,
  },
  handler: async () => ({
    content: [
      {
        type: "text" as const,
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
};

// ---------------------------------------------------------------------------
// Tool 2: Moderate analysis — benefits from a mid-tier model
// ---------------------------------------------------------------------------

const summarizeData: ToolDefinition = {
  name: "summarize_data",
  description:
    "Summarizes data with trend analysis. Moderate reasoning required.",
  schema: {
    dataset: z.string().describe("Name of the dataset to summarize"),
  },
  modelPreferences: {
    intelligencePriority: 0.5,
    costPriority: 0.5,
    speedPriority: 0.5,
  },
  handler: async () => ({
    content: [
      {
        type: "text" as const,
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
};

// ---------------------------------------------------------------------------
// Tool 3: Complex analysis — benefits from a highly capable model
// ---------------------------------------------------------------------------

const deepAnalysis: ToolDefinition = {
  name: "deep_analysis",
  description:
    "Multi-dimensional analysis with evidence chains, statistical modeling, and actionable recommendations. Benefits significantly from advanced reasoning.",
  schema: {
    subject: z.string().describe("Subject of the analysis"),
    depth: z
      .enum(["standard", "comprehensive"])
      .optional()
      .describe("Analysis depth"),
  },
  modelPreferences: {
    intelligencePriority: 0.9,
    costPriority: 0.2,
    speedPriority: 0.3,
  },
  handler: async () => ({
    content: [
      {
        type: "text" as const,
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
};

/** All tool definitions */
export const tools: ToolDefinition[] = [listItems, summarizeData, deepAnalysis];
