import { Builder, By, WebDriver, until, WebElement } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { z } from "zod";
import { HtmlAnalysisService } from './htmlAnalysisService';

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

export class SeleniumDoctolibService {
  private driver: WebDriver | null = null;
  private htmlAnalysisService: HtmlAnalysisService;

  constructor() {
    this.htmlAnalysisService = new HtmlAnalysisService();
  }

  private async initDriver(): Promise<WebDriver> {
    const chromeOptions = new ChromeOptions();
    chromeOptions.addArguments('--headless'); // Run in headless mode
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-gpu');
    chromeOptions.addArguments('--window-size=1920,1080');
    chromeOptions.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();

    return this.driver;
  }

  private async closeDriver(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }

  // AI-powered element finder using HtmlAnalysisService
  private async findElementsIntelligently(purpose: string, context?: string): Promise<WebElement[]> {
    if (!this.driver) return [];

    try {
      // Get page HTML
      const pageSource = await this.driver.getPageSource();

      // Use HtmlAnalysisService to analyze the HTML
      const elementAnalyses = await this.htmlAnalysisService.analyzePageForElements(pageSource, purpose);

      // Convert analysis results to actual WebElements
      const elements: WebElement[] = [];

      for (const analysis of elementAnalyses) {
        try {
          const foundElements = await this.driver.findElements(By.css(analysis.selector));
          elements.push(...foundElements);
        } catch (error) {
          console.warn(`Failed to find elements with selector: ${analysis.selector}`);
        }
      }

      console.log(`🔍 Found ${elements.length} elements for purpose: ${purpose}`);
      return elements;
    } catch (error) {
      console.error('Error in intelligent element finding:', error);
      return [];
    }
  }

  private async handleCookieBanner(): Promise<void> {
    if (!this.driver) return;

    console.log('🍪 Looking for cookie banner...');
    
    const cookieElements = await this.findElementsIntelligently('cookie_banner');
    
    if (cookieElements.length > 0) {
      try {
        await cookieElements[0].click();
        console.log('✅ Cookie banner handled');
        await this.driver.sleep(1000);
      } catch (error) {
        console.log('⚠️ Could not click cookie banner');
      }
    } else {
      console.log('⚠️ No cookie banner found');
    }
  }

  private async fillSearchForm(specialty: string, location: string): Promise<boolean> {
    if (!this.driver) return false;

    console.log('🔍 Looking for search form...');
    
    // Find specialty input
    const specialtyInputs = await this.findElementsIntelligently('search_specialty_input');
    if (specialtyInputs.length > 0) {
      try {
        await specialtyInputs[0].clear();
        await specialtyInputs[0].sendKeys(specialty);
        console.log('✅ Specialty field filled');
      } catch (error) {
        console.log('⚠️ Could not fill specialty field');
      }
    }

    // Find location input
    const locationInputs = await this.findElementsIntelligently('search_location_input');
    if (locationInputs.length > 0) {
      try {
        await locationInputs[0].clear();
        await locationInputs[0].sendKeys(location);
        console.log('✅ Location field filled');
      } catch (error) {
        console.log('⚠️ Could not fill location field');
      }
    }

    await this.driver.sleep(1000);

    // Find and click submit button
    const submitButtons = await this.findElementsIntelligently('search_submit_button');
    if (submitButtons.length > 0) {
      try {
        await submitButtons[0].click();
        console.log('✅ Search submitted');
        return true;
      } catch (error) {
        console.log('⚠️ Could not click submit button');
      }
    }

    // Fallback: try pressing Enter on location field
    if (locationInputs.length > 0) {
      try {
        await locationInputs[0].sendKeys('\n');
        console.log('✅ Search submitted via Enter');
        return true;
      } catch (error) {
        console.log('⚠️ Could not submit via Enter');
      }
    }

    return false;
  }

  private async extractDoctorResults(maxResults: number = 10): Promise<any[]> {
    if (!this.driver) return [];

    console.log('📋 Looking for doctor results...');

    try {
      // Wait a bit for results to load
      await this.driver.sleep(3000);

      // Use intelligent analysis to find doctor results
      const results: any = await this.driver.executeScript(`
        function extractDoctorData(maxResults) {
          // Look for doctor cards/containers intelligently
          const allElements = Array.from(document.querySelectorAll('div, article, li, section'));
          const doctorCards = [];
          
          for (const element of allElements) {
            const text = element.textContent || '';
            const hasLink = element.querySelector('a[href]');
            
            // Check if this looks like a doctor card
            const hasName = /dr\.?\s+[a-z]+|docteur\s+[a-z]+/i.test(text);
            const hasSpecialty = /cardiologue|dentiste|médecin|gynécologue|dermatologue|ophtalmologue/i.test(text);
            const hasAddress = /rue|avenue|boulevard|paris|lyon|marseille|\d{5}/i.test(text);
            const hasAvailability = /disponible|rendez-vous|aujourd'hui|demain|lundi|mardi|mercredi|jeudi|vendredi/i.test(text);
            
            // Score this element
            let score = 0;
            if (hasLink) score += 2;
            if (hasName) score += 3;
            if (hasSpecialty) score += 2;
            if (hasAddress) score += 1;
            if (hasAvailability) score += 1;
            if (text.length > 50 && text.length < 1000) score += 1;
            
            if (score >= 4) {
              doctorCards.push({ element, score, text: text.substring(0, 200) });
            }
          }
          
          // Sort by score and take top results
          doctorCards.sort((a, b) => b.score - a.score);
          const topCards = doctorCards.slice(0, maxResults);
          
          // Extract data from each card
          const doctors = [];
          
          for (let i = 0; i < topCards.length; i++) {
            const card = topCards[i].element;
            const text = card.textContent || '';
            
            // Extract name
            let name = null;
            const nameMatch = text.match(/(?:Dr\.?\s+|Docteur\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            if (nameMatch) {
              name = nameMatch[0];
            } else {
              // Look for name in links or headings
              const nameElements = card.querySelectorAll('h1, h2, h3, h4, a, strong, b');
              for (const el of nameElements) {
                const elText = el.textContent?.trim() || '';
                if (elText.length > 5 && elText.length < 50 && /[A-Z]/.test(elText)) {
                  name = elText;
                  break;
                }
              }
            }
            
            // Extract specialty
            let specialty = null;
            const specialties = ['cardiologue', 'dentiste', 'médecin généraliste', 'gynécologue', 'dermatologue', 'ophtalmologue', 'pédiatre'];
            for (const spec of specialties) {
              if (text.toLowerCase().includes(spec)) {
                specialty = spec;
                break;
              }
            }
            
            // Extract address
            let address = null;
            const addressMatch = text.match(/(\d+[^,]*(?:rue|avenue|boulevard|place)[^,]*(?:,\s*\d{5}[^,]*)?)/i);
            if (addressMatch) {
              address = addressMatch[1].trim();
            }
            
            // Extract link
            let link = null;
            const linkElement = card.querySelector('a[href]');
            if (linkElement) {
              const href = linkElement.getAttribute('href');
              if (href) {
                link = href.startsWith('http') ? href : new URL(href, location.origin).toString();
              }
            }
            
            // Extract availability
            const availabilities = [];
            const availMatch = text.match(/(aujourd'hui|demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/gi);
            if (availMatch) {
              availabilities.push(...availMatch);
            }
            
            if (name || specialty || link) {
              doctors.push({
                id: 'selenium_' + i + '_' + Date.now(),
                name: name || 'Docteur inconnu',
                specialty: specialty || 'Spécialité non spécifiée',
                address: address || 'Adresse non disponible',
                link: link || 'https://www.doctolib.fr/',
                availabilities: [...new Set(availabilities)],
                next_availability: availabilities[0] || null,
                rawText: text.substring(0, 300)
              });
            }
          }
          
          return {
            totalFound: doctorCards.length,
            extracted: doctors,
            debug: topCards.map(c => ({ score: c.score, text: c.text }))
          };
        }
        
        return extractDoctorData(${maxResults});
      `);

      console.log(`📊 Analysis found ${results.totalFound} potential doctor cards`);
      console.log(`✅ Extracted ${results.extracted.length} doctor records`);

      if (results.extracted.length === 0) {
        console.log('🔍 Debug info:', results.debug);
      }

      return results.extracted || [];
    } catch (error) {
      console.error('Error extracting doctor results:', error);
      return [];
    }
  }

  public async searchDoctors(params: DoctolibSearchParams, maxResults: number = 10): Promise<DoctolibDoctor[]> {
    try {
      console.log('🚀 Starting Doctolib search...');
      console.log(`🔍 Searching for ${params.specialty} in ${params.location}`);

      await this.initDriver();
      console.log('✅ Driver initialized');

      await this.driver!.get('https://www.doctolib.fr/');
      console.log('✅ Navigated to Doctolib');

      await this.handleCookieBanner();

      const searchSuccess = await this.fillSearchForm(params.specialty, params.location);
      if (!searchSuccess) {
        throw new Error('Failed to submit search form');
      }

      const rawResults = await this.extractDoctorResults(maxResults);

      // Convert to DoctolibDoctor format
      const doctors: DoctolibDoctor[] = rawResults.map((result: any) => ({
        id: result.id,
        name: result.name,
        specialty: result.specialty,
        address: result.address,
        phone: undefined, // Phone extraction not implemented yet
        availability: result.availabilities,
        doctolibUrl: result.link,
        next_availability: result.next_availability
      }));

      console.log(`✅ Search completed. Found ${doctors.length} doctors`);
      return doctors;

    } catch (error) {
      console.error('❌ Error during Doctolib search:', error);
      throw error;
    } finally {
      await this.closeDriver();
      console.log('🛑 Driver closed');
    }
  }
}
