import OpenAI from 'openai';

export interface ElementAnalysis {
  selector: string;
  confidence: number;
  reasoning: string;
}

export interface PageAnalysis {
  cookieButtons: ElementAnalysis[];
  searchInputs: {
    specialty: ElementAnalysis[];
    location: ElementAnalysis[];
  };
  submitButtons: ElementAnalysis[];
  resultContainers: ElementAnalysis[];
}

export class HtmlAnalysisService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzePageForElements(html: string, purpose: string): Promise<ElementAnalysis[]> {
    try {
      // Truncate HTML to avoid token limits
      const truncatedHtml = this.truncateHtml(html, 8000);

      const prompt = this.buildAnalysisPrompt(truncatedHtml, purpose);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert web scraping assistant. Analyze HTML and provide CSS selectors for specific elements. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response - handle potential markdown formatting
      let jsonContent = content.trim();

      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Parse JSON response
      const analysis = JSON.parse(jsonContent);
      return Array.isArray(analysis) ? analysis : [];

    } catch (error) {
      console.error('Error in HTML analysis:', error);
      return [];
    }
  }

  private buildAnalysisPrompt(html: string, purpose: string): string {
    const prompts = {
      cookie_banner: `
Analyze this HTML and find cookie consent/banner buttons. Look for buttons that accept cookies or close cookie banners.
Common texts: "Accept", "Agree", "Accepter", "Tout accepter", "Agree and close", "J'accepte"

HTML:
${html}

Respond with JSON array of objects with this structure:
[
  {
    "selector": "CSS selector (prefer ID > class > attribute > tag)",
    "confidence": 0.9,
    "reasoning": "Why this element is likely a cookie button"
  }
]
`,

      search_specialty_input: `
Analyze this HTML and find input fields for medical specialty search (like "cardiologue", "dentiste").
Look for inputs with placeholders, names, or labels related to specialty, profession, "quoi", "what".

HTML:
${html}

Respond with JSON array of objects with this structure:
[
  {
    "selector": "CSS selector (prefer name > id > class > placeholder)",
    "confidence": 0.8,
    "reasoning": "Why this input is for specialty search"
  }
]
`,

      search_location_input: `
Analyze this HTML and find input fields for location search (like "Paris", "Lyon").
Look for inputs with placeholders, names, or labels related to location, city, "où", "where".

HTML:
${html}

Respond with JSON array of objects with this structure:
[
  {
    "selector": "CSS selector (prefer name > id > class > placeholder)",
    "confidence": 0.8,
    "reasoning": "Why this input is for location search"
  }
]
`,

      search_submit_button: `
Analyze this HTML and find search/submit buttons for a doctor search form.
Look for buttons with type="submit" or text like "Rechercher", "Search", "Trouver", "Chercher".

HTML:
${html}

Respond with JSON array of objects with this structure:
[
  {
    "selector": "CSS selector (prefer type > id > class > text content)",
    "confidence": 0.9,
    "reasoning": "Why this button submits the search"
  }
]
`,

      doctor_results: `
Analyze this HTML and find containers/cards that display doctor search results.
Look for repeated elements containing doctor names, specialties, addresses, availability info.
Each result should have a link to doctor profile and contain medical information.

HTML:
${html}

Respond with JSON array of objects with this structure:
[
  {
    "selector": "CSS selector for result container (class or data attributes preferred)",
    "confidence": 0.7,
    "reasoning": "Why this element contains doctor results"
  }
]
`
    };

    return prompts[purpose as keyof typeof prompts] || `
Analyze this HTML for elements related to: ${purpose}

HTML:
${html}

Respond with JSON array of selector objects.
`;
  }

  private truncateHtml(html: string, maxLength: number): string {
    if (html.length <= maxLength) {
      return html;
    }

    // Try to keep important parts: head, forms, main content areas
    const important = [
      /<head>.*?<\/head>/s,
      /<form.*?<\/form>/gs,
      /<main.*?<\/main>/gs,
      /<div[^>]*class="[^"]*search[^"]*"[^>]*>.*?<\/div>/gs,
      /<div[^>]*class="[^"]*result[^"]*"[^>]*>.*?<\/div>/gs,
    ];

    let truncated = '';
    for (const regex of important) {
      const matches = html.match(regex);
      if (matches) {
        truncated += matches.join('\n');
      }
    }

    if (truncated.length > maxLength) {
      truncated = truncated.substring(0, maxLength);
    }

    return truncated || html.substring(0, maxLength);
  }

  async analyzeFullPage(html: string): Promise<PageAnalysis> {
    const [cookieButtons, specialtyInputs, locationInputs, submitButtons, resultContainers] = await Promise.all([
      this.analyzePageForElements(html, 'cookie_banner'),
      this.analyzePageForElements(html, 'search_specialty_input'),
      this.analyzePageForElements(html, 'search_location_input'),
      this.analyzePageForElements(html, 'search_submit_button'),
      this.analyzePageForElements(html, 'doctor_results'),
    ]);

    return {
      cookieButtons,
      searchInputs: {
        specialty: specialtyInputs,
        location: locationInputs,
      },
      submitButtons,
      resultContainers,
    };
  }
}
