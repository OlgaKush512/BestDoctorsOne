import { DEBUG, DRY_RUN, MCP_PLAYWRIGHT_COMMAND, MCP_PLAYWRIGHT_ARGS } from './config.js';

// Lazy-import SDK to avoid hard crash if not installed yet
let Client, StdioClientTransport;
async function loadSdk() {
  if (!Client || !StdioClientTransport) {
    // Since @modelcontextprotocol/sdk v0.6, root import isn't exported.
    // Prefer documented subpath exports; if Node cannot resolve directories,
    // fall back to explicit dist file paths.
    try {
      const clientMod = await import('@modelcontextprotocol/sdk/client/index.js');
      const stdioMod = await import('@modelcontextprotocol/sdk/client/stdio.js');
      Client = clientMod.Client;
      StdioClientTransport = stdioMod.StdioClientTransport;
    } catch (e1) {
      try {
        const clientMod = await import('@modelcontextprotocol/sdk/dist/client/index.js');
        const stdioMod = await import('@modelcontextprotocol/sdk/dist/client/stdio.js');
        Client = clientMod.Client;
        StdioClientTransport = stdioMod.StdioClientTransport;
      } catch (e2) {
        throw e1;
      }
    }
    if (!Client || !StdioClientTransport) {
      throw new Error('MCP SDK structures not found. Check @modelcontextprotocol/sdk version.');
    }
  }
}

export class MCPPlaywright {
  constructor() {
    this.client = null;
    this.transport = null;
    this.dryRun = DRY_RUN;
  }

  async connect() {
    if (this.dryRun) {
      if (DEBUG) console.log('[DRY_RUN] Skip MCP connect');
      return;
    }
    try {
      await loadSdk();
      const needsYes = /(^|\/)npx(?:\.cmd)?$/i.test(MCP_PLAYWRIGHT_COMMAND);
      const args = needsYes ? ['-y', ...MCP_PLAYWRIGHT_ARGS] : [...MCP_PLAYWRIGHT_ARGS];
      this.transport = new StdioClientTransport({
        command: MCP_PLAYWRIGHT_COMMAND,
        args,
      });
      this.client = new Client(
        { name: 'mcp-doctolib-mvp', version: '0.1.0' },
        { capabilities: {}, requestTimeoutMsec: 10000 }
      );
      await this.client.connect(this.transport);
      if (DEBUG) {
        const tools = await this.client.listTools();
        console.log('[MCP] Available tools:', tools?.tools?.map(t => t.name));
      }
    } catch (e) {
      // Fallback to dry-run if server cannot start (e.g., package not found or no network)
      this.dryRun = true;
      this.client = null;
      this.transport = null;
      console.warn('[MCP] Failed to start Playwright server. Falling back to DRY_RUN for this session.');
      if (DEBUG) console.warn(e?.message || e);
    }
  }

  async callTool(name, args) {
    if (this.dryRun) {
      if (DEBUG) console.log(`[DRY_RUN] callTool ${name}`, args);
      return { content: [{ type: 'text', text: '[DRY_RUN]' }], isDryRun: true };
    }
    if (!this.client) throw new Error('MCP client not connected');
    if (DEBUG) console.log('[MCP] callTool', name, args);
    try {
      return await this.client.callTool(name, args);
    } catch (e) {
      const msg = e?.message || '';
      const code = e?.code;
      const isTimeout = code === -2 || /Request timed out/i.test(msg);
      const isClosed = code === -1 || /Connection closed/i.test(msg);
      if (isTimeout || isClosed) {
        console.warn('[MCP] Tool call failed (timeout/closed). Switching to DRY_RUN for this session.');
        if (DEBUG) console.warn(msg);
        this.dryRun = true;
        return { content: [{ type: 'text', text: '[DRY_RUN]' }], isDryRun: true };
      }
      throw e;
    }
  }

  async close() {
    if (this.dryRun) return;
    try { await this.transport.close(); } catch {}
  }
}
