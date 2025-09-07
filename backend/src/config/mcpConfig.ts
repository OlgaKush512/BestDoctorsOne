import dotenv from "dotenv";

dotenv.config();

// MCP Playwright server config
export const MCP_PLAYWRIGHT_COMMAND =
  process.env.MCP_PLAYWRIGHT_COMMAND || "npx";
// Default to documented server package; can be overridden via .env
export const MCP_PLAYWRIGHT_ARGS = (
  process.env.MCP_PLAYWRIGHT_ARGS || "@playwright/mcp@latest"
).split(" ");

// Tuning
export const DEBUG = process.env.DEBUG === "1" || process.env.DEBUG === "true";
export const DRY_RUN =
  process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
