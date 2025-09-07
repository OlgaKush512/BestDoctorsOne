import {
  DEBUG,
  DRY_RUN,
  MCP_PLAYWRIGHT_COMMAND,
  MCP_PLAYWRIGHT_ARGS,
} from "../config/mcpConfig";

// Lazy-import SDK to avoid hard crash if not installed yet
let Client: any, StdioClientTransport: any;
async function loadSdk() {
  if (!Client || !StdioClientTransport) {
    try {
      // Use require for dynamic loading to avoid TypeScript module resolution issues
      const clientPath = require.resolve(
        "@modelcontextprotocol/sdk/dist/esm/client/index.js"
      );
      const stdioPath = require.resolve(
        "@modelcontextprotocol/sdk/dist/esm/client/stdio.js"
      );

      const clientMod = require(clientPath);
      const stdioMod = require(stdioPath);

      Client = clientMod.Client;
      StdioClientTransport = stdioMod.StdioClientTransport;
    } catch (e1) {
      try {
        // Fallback to CJS
        const clientMod = require("@modelcontextprotocol/sdk/dist/cjs/client/index.js");
        const stdioMod = require("@modelcontextprotocol/sdk/dist/cjs/client/stdio.js");
        Client = clientMod.Client;
        StdioClientTransport = stdioMod.StdioClientTransport;
      } catch (e2) {
        throw e1;
      }
    }
    if (!Client || !StdioClientTransport) {
      throw new Error(
        "MCP SDK structures not found. Check @modelcontextprotocol/sdk version."
      );
    }
  }
}

export class MCPPlaywright {
  private client: any = null;
  private transport: any = null;
  private dryRun: boolean = DRY_RUN;

  async connect(): Promise<void> {
    if (this.dryRun) {
      if (DEBUG) console.log("[DRY_RUN] Skip MCP connect");
      return;
    }
    try {
      await loadSdk();
      const needsYes = /(^|\/)npx(?:\.cmd)?$/i.test(MCP_PLAYWRIGHT_COMMAND);
      const args = needsYes
        ? ["-y", ...MCP_PLAYWRIGHT_ARGS]
        : [...MCP_PLAYWRIGHT_ARGS];
      this.transport = new StdioClientTransport({
        command: MCP_PLAYWRIGHT_COMMAND,
        args,
      });
      this.client = new Client(
        { name: "bestdoctor-backend", version: "1.0.0" },
        { capabilities: {}, requestTimeoutMsec: 10000 }
      );
      await this.client.connect(this.transport);
      if (DEBUG) {
        const tools = await this.client.listTools();
        console.log(
          "[MCP] Available tools:",
          tools?.tools?.map((t: any) => t.name)
        );
      }
    } catch (e: any) {
      // Fallback to dry-run if server cannot start (e.g., package not found or no network)
      this.dryRun = true;
      this.client = null;
      this.transport = null;
      console.warn(
        "[MCP] Failed to start Playwright server. Falling back to DRY_RUN for this session."
      );
      if (DEBUG) console.warn(e?.message || e);
    }
  }

  async callTool(name: string, args: any): Promise<any> {
    if (this.dryRun) {
      if (DEBUG) console.log(`[DRY_RUN] callTool ${name}`, args);
      return { content: [{ type: "text", text: "[DRY_RUN]" }], isDryRun: true };
    }
    if (!this.client) throw new Error("MCP client not connected");
    if (DEBUG) console.log("[MCP] callTool", name, args);
    try {
      return await this.client.callTool(name, args);
    } catch (e: any) {
      const msg = e?.message || "";
      const code = e?.code;
      const isTimeout = code === -2 || /Request timed out/i.test(msg);
      const isClosed = code === -1 || /Connection closed/i.test(msg);
      if (isTimeout || isClosed) {
        console.warn(
          "[MCP] Tool call failed (timeout/closed). Switching to DRY_RUN for this session."
        );
        if (DEBUG) console.warn(msg);
        this.dryRun = true;
        return {
          content: [{ type: "text", text: "[DRY_RUN]" }],
          isDryRun: true,
        };
      }
      throw e;
    }
  }

  async close(): Promise<void> {
    if (this.dryRun) return;
    try {
      if (this.transport) {
        await this.transport.close();
      }
    } catch {}
  }
}
