import path from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { validatePatchIntent } from "./tools/validatePatchIntent.js";
import { explainViolations } from "./tools/explainViolations.js";
import { generateArtifacts } from "./tools/generateArtifacts.js";

const server = new Server(
  {
    name: "arrow-stack-contract-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "validatePatchIntent",
        description: "Validate changed files against Arrow Stack policy contract",
        inputSchema: {
          type: "object",
          properties: {
            repositoryRoot: { type: "string" },
            task: { type: "string", enum: ["theme-edit", "component-add", "full"] },
            changedFiles: { type: "array", items: { type: "string" } },
          },
          required: ["repositoryRoot"],
        },
      },
      {
        name: "explainViolations",
        description: "Convert a validation result to a human-readable summary",
        inputSchema: {
          type: "object",
          properties: {
            validationResult: { type: "object" },
          },
          required: ["validationResult"],
        },
      },
      {
        name: "generateArtifacts",
        description: "Generate runtime hints and policy report schema from contract",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "validatePatchIntent") {
    const repositoryRoot = path.resolve(String(args?.repositoryRoot ?? process.cwd()));
    const task = args?.task ? String(args.task) : undefined;
    const changedFiles = Array.isArray(args?.changedFiles)
      ? args?.changedFiles.map((filePath) => String(filePath))
      : [];

    const validationResult = validatePatchIntent({
      repositoryRoot,
      task: task as "theme-edit" | "component-add" | "full" | undefined,
      changedFiles,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(validationResult, null, 2),
        },
      ],
    };
  }

  if (name === "explainViolations") {
    const result = args?.validationResult as Parameters<typeof explainViolations>[0];
    return {
      content: [
        {
          type: "text",
          text: explainViolations(result),
        },
      ],
    };
  }

  if (name === "generateArtifacts") {
    const result = generateArtifacts();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
