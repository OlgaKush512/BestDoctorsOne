import 'dotenv/config';

export const BLACKBOX_API_KEY = process.env.BLACKBOX_API_KEY || '';
export const BLACKBOX_BASE_URL = process.env.BLACKBOX_BASE_URL || 'https://api.blackbox.ai/v1';
export const BLACKBOX_MODEL = process.env.BLACKBOX_MODEL || 'blackbox-omni';
export const BLACKBOX_EXTRA_HEADER_NAME = process.env.BLACKBOX_EXTRA_HEADER_NAME || '';
export const BLACKBOX_EXTRA_HEADER_VALUE = process.env.BLACKBOX_EXTRA_HEADER_VALUE || '';

// OpenAI provider config
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// MCP Playwright server config
export const MCP_PLAYWRIGHT_COMMAND = process.env.MCP_PLAYWRIGHT_COMMAND || 'npx';
// Default to documented server package; can be overridden via .env
export const MCP_PLAYWRIGHT_ARGS = (process.env.MCP_PLAYWRIGHT_ARGS || '@playwright/mcp@latest').split(' ');

// Tuning
export const DEBUG = process.env.DEBUG === '1' || process.env.DEBUG === 'true';
export const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
export const BYPASS_LLM = process.env.BYPASS_LLM === '1' || process.env.BYPASS_LLM === 'true';

 
