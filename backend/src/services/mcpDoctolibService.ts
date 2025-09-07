import { z } from "zod";
import { MCPPlaywright } from "./mcpClient";
import { DEBUG } from "../config/mcpConfig";

export interface DoctolibSearchParams {
  specialty: string;
  location: string;
  date: string;
}

export interface DoctolibDoctor {
  id: string;
  name: string;
  specialty: string;
  address: string;
  phone?: string;
  availability: string[];
  doctolibUrl: string;
  next_availability?: string;
}

const ArgsSchema = z.object({
  specialty: z.string().min(2),
  location: z.string().min(2),
  date: z.string().optional(),
  max_results: z.number().int().positive().max(50).optional(),
});

export class MCPDoctolibService {
  async searchDoctors(params: DoctolibSearchParams): Promise<DoctolibDoctor[]> {
    const parsed = ArgsSchema.parse({
      ...params,
      max_results: 10,
    });
    const { specialty, location, date, max_results = 10 } = parsed;

    console.log(
      `🔍 Searching Doctolib via MCP for ${specialty} in ${location} on ${date}`
    );

    const mcp = new MCPPlaywright();
    await mcp.connect();

    try {
      // Helper functions
      const tryClickCookie = async (): Promise<boolean> => {
        // Priority: Didomi button by id
        try {
          await mcp.callTool("page.waitForSelector", {
            selector: "#didomi-notice-agree-button",
            timeout: 2500,
          });
          await mcp.callTool("page.click", {
            selector: "#didomi-notice-agree-button",
            timeout: 2500,
          });
          return true;
        } catch {}
        // OneTrust common id
        try {
          await mcp.callTool("page.click", {
            selector: "#onetrust-accept-btn-handler",
            timeout: 2000,
          });
          return true;
        } catch {}
        // French text variants
        try {
          await mcp.callTool("page.click", {
            selector: 'button:has-text("Tout accepter")',
            timeout: 2000,
          });
          return true;
        } catch {}
        try {
          await mcp.callTool("page.click", {
            selector: 'button:has-text("Accepter tout")',
            timeout: 2000,
          });
          return true;
        } catch {}
        // Generic text/evaluate fallback
        try {
          const res = await mcp.callTool("page.evaluate", {
            script: `() => {
              const texts = ['Agree and close','Tout accepter','Accepter tout','Accepter','J\'accepte','Accept all','Accept'];
              const btn = Array.from(document.querySelectorAll('button, [role="button"]'))
                .find(b => texts.some(t => (b.textContent||'').trim().toLowerCase().includes(t.toLowerCase())));
              if (btn) { btn.click(); return true; }
              const didomi = document.querySelector('#didomi-notice-agree-button');
              if (didomi) { didomi.click(); return true; }
              const oneTrust = document.querySelector('#onetrust-accept-btn-handler');
              if (oneTrust) { oneTrust.click(); return true; }
              return false;
            }`,
          });
          const ok = res?.content?.find?.((c: any) => c.type === "text")?.text;
          return ok === "true" || ok === true;
        } catch {}
        return false;
      };

      const fillFirstAvailable = async (
        selectors: string[],
        value: string
      ): Promise<boolean> => {
        for (const sel of selectors) {
          try {
            await mcp.callTool("page.fill", { selector: sel, text: value });
            return true;
          } catch {}
        }
        // Fallback: set value via evaluate
        try {
          const expr = selectors
            .map((s) => `document.querySelector(${JSON.stringify(s)})`)
            .join("||");
          const script = `() => { const el = ${expr}; if (!el) return false; el.focus && el.focus(); el.value = ${JSON.stringify(
            value
          )}; el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return true; }`;
          const r = await mcp.callTool("page.evaluate", { script });
          const ok = r?.content?.find?.((c: any) => c.type === "text")?.text;
          return ok === "true" || ok === true;
        } catch {}
        return false;
      };

      const waitAnySelector = async (
        selectors: string[],
        timeout = 15000
      ): Promise<boolean> => {
        for (const sel of selectors) {
          try {
            await mcp.callTool("page.waitForSelector", {
              selector: sel,
              timeout,
            });
            return true;
          } catch {}
        }
        return false;
      };

      const pressEnter = async (selector: string): Promise<boolean> => {
        try {
          await mcp.callTool("page.press", { selector, key: "Enter" });
          return true;
        } catch {
          return false;
        }
      };

      const clickFirstAvailable = async (
        selectors: string[],
        timeout = 4000
      ): Promise<boolean> => {
        for (const sel of selectors) {
          try {
            await mcp.callTool("page.click", { selector: sel, timeout });
            return true;
          } catch {}
        }
        return false;
      };

      // Navigation
      await mcp.callTool("page.new", {});
      await mcp.callTool("page.goto", { url: "https://www.doctolib.fr/" });

      // Cookie banners (best-effort)
      await tryClickCookie();

      // Fill search fields: specialty and location with multiple fallbacks
      const specialtySelectors = [
        "input.searchbar-query-input",
        "form.searchbar input.searchbar-input.searchbar-query-input",
        'input[name="searchbar-query"]',
        'input[name="query"]',
        'input[id*="searchbar-query" i]',
        'input[id*="search-query" i]',
        'input[placeholder*="Nom, spécialité" i]',
        'input[placeholder*="spécialité" i]',
        'input[placeholder*="Specialite" i]',
        'input[placeholder*="Quoi" i]',
        'input[aria-label*="spécialité" i]',
        'input[aria-label*="Nom" i]',
        'input[aria-label*="Quoi" i]',
      ];
      const locationSelectors = [
        "input.searchbar-place-input",
        "form.searchbar input.searchbar-input.searchbar-place-input",
        'input[name="searchbar-location"]',
        'input[name="where"]',
        'input[id*="searchbar-location" i]',
        'input[id*="search-location" i]',
        'input[placeholder*="Où" i]',
        'input[placeholder*="Ou" i]',
        'input[aria-label*="Où" i]',
        'input[aria-label*="Ou" i]',
      ];

      await fillFirstAvailable(specialtySelectors, specialty);
      await fillFirstAvailable(locationSelectors, location);

      // Submit search: try Enter on location, else click submit button
      const submitCandidates = [
        "button.searchbar-submit-button",
        'form.searchbar button[type="submit"]',
        'form [type="submit"]',
        'button[type="submit"]',
        '[data-test-id*="searchbar" i] button',
        'form button:has-text("Rechercher")',
      ];
      const submitted =
        (await pressEnter('input[name="searchbar-location"]')) ||
        (await clickFirstAvailable(submitCandidates));
      if (!submitted) {
        // Last resort: press Enter on specialty
        await pressEnter('input[name="searchbar-query"]');
      }

      // Wait for results container (try several options)
      await waitAnySelector(
        [
          '[data-test-id="search-results"]',
          '[data-test-id*="search-results" i]',
          'main [role="list"]',
          '[data-testid*="results" i]',
          "article",
        ],
        20000
      );

      // Optional: date filter — best-effort; skip silently if not available
      if (date) {
        try {
          const opened = await clickFirstAvailable(
            [
              '[data-test-id="date-picker-trigger"]',
              '[aria-label*="date" i]',
              'button:has-text("Date")',
            ],
            5000
          );
          if (opened) {
            // Many UIs don't use input[type=date]; try to type and Enter if present
            await mcp.callTool("page.type", {
              selector: 'input[type="date"]',
              text: date,
            });
            await mcp.callTool("page.press", {
              selector: 'input[type="date"]',
              key: "Enter",
            });
          }
          try {
            await mcp.callTool("page.waitForLoadState", {
              state: "networkidle",
              timeout: 8000,
            });
          } catch {}
        } catch (e: any) {
          if (DEBUG) console.warn("Date filter step skipped:", e?.message || e);
        }
      }

      // Extract results via evaluation with broader selectors and fallbacks
      const extraction = await mcp.callTool("page.evaluate", {
        script: `() => {
          const toAbs = (href) => {
            try { return new URL(href, location.origin).toString(); } catch { return null; }
          };
          // Prefer new Doctolib card structure if present
          let cards = Array.from(document.querySelectorAll('.dl-card-content'));
          if (cards.length === 0) {
            cards = Array.from(document.querySelectorAll('[data-test-id="search-result-item"], [data-test-id*="result" i], article, li'))
              .filter(el => el.querySelector('a[href]'));
          }
          const items = cards.slice(0, ${max_results}).map(row => {
            // Name and link
            const nameFromH2 = row.querySelector('a h2')?.textContent?.trim();
            const nameSel = '[data-test-id*="name" i], [data-test*="practitioner-name" i], h2, h3, a[aria-label*="Profil" i]';
            const name = nameFromH2 || row.querySelector(nameSel)?.textContent?.trim() || null;
            const anchor = row.querySelector('a[href*="/medecin"], a[href*="/dentiste"], a[href*="/sante"], a[href^="/" i]');
            const rawHref = anchor?.getAttribute('href') || '';
            const link = rawHref ? toAbs(rawHref) : null;

            // Specialty and address (optional)
            const specSel = '[data-test-id*="specialit" i], [class*="specialit" i], p[data-design-system-component="Paragraph"]';
            const specialty = row.querySelector(specSel)?.textContent?.trim() || null;
            let address = null;
            const addrParts = Array.from(row.querySelectorAll(
              '.flex.flex-wrap.gap-x-4 p, ' +
              '[data-test-id*="address" i]'))
              .map(el => (el.textContent||'').trim())
              .filter(Boolean);
            if (addrParts.length) address = addrParts.join(', ');

            // Availabilities: collect visible labels inside the availabilities container
            const availContainer = row.querySelector('[data-test-id="availabilities-container"]') || row;
            const availCandidates = Array.from(availContainer.querySelectorAll('.dl-pill .dl-text, time, [data-test-id*="availability" i], [class*="availability" i], .dl-pill span'))
              .map(el => (el.textContent||'').trim())
              .filter(t => t && !/^prochaine disponibilit/i.test(t));
            const availabilities = Array.from(new Set(availCandidates));
            const next_availability = availabilities[0] || null;

            return { name, specialty, address, link, next_availability, availabilities };
          }).filter(x => x && (x.name || x.link));
          return JSON.stringify(items);
        }`,
      });

      // Normalize MCP response content
      const textPayload = extraction?.content?.find?.(
        (c: any) => c.type === "text"
      )?.text;
      let items: any[] = [];
      try {
        items = JSON.parse(textPayload);
      } catch {}

      if (!Array.isArray(items) || items.length === 0) {
        console.log("⚠️ No items extracted via MCP, returning empty results");
        return [];
      }

      // Convert to DoctolibDoctor format
      const doctors: DoctolibDoctor[] = items.map((item, index) => ({
        id: `mcp_${index}_${Date.now()}`,
        name: item.name || "Unknown Doctor",
        specialty: item.specialty || specialty,
        address: item.address || "Address not available",
        phone: undefined, // Not extracted in this version
        availability: item.availabilities || [],
        doctolibUrl: item.link || "https://www.doctolib.fr/",
        next_availability: item.next_availability,
      }));

      console.log(`✅ Found ${doctors.length} doctors via MCP Playwright`);
      return doctors;
    } finally {
      await mcp.close();
    }
  }
}
