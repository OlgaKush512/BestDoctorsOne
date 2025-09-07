import { Builder, By, WebDriver, WebElement } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { HtmlAnalysisService } from './htmlAnalysisService';

export interface DoctolibSearchParams {
  specialty: string;
  location: string;
  date?: string;
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

export class AiDoctolibService {
  private driver: WebDriver | null = null;
  private htmlAnalysisService: HtmlAnalysisService;

  constructor() {
    this.htmlAnalysisService = new HtmlAnalysisService();
  }

  private async initDriver(): Promise<WebDriver> {
    const chromeOptions = new ChromeOptions();
    chromeOptions.addArguments('--headless');
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-gpu');
    chromeOptions.addArguments('--window-size=1920,1080');
    chromeOptions.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

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

  // AI-powered element finder
  private async findElementsByAI(purpose: string): Promise<WebElement[]> {
    if (!this.driver) return [];

    try {
      const pageSource = await this.driver.getPageSource();
      const analyses = await this.htmlAnalysisService.analyzePageForElements(pageSource, purpose);

      const elements: WebElement[] = [];
      for (const analysis of analyses) {
        try {
          const foundElements = await this.driver.findElements(By.css(analysis.selector));
          elements.push(...foundElements);
        } catch (error) {
          console.warn(`Selector failed: ${analysis.selector}`);
        }
      }

      return elements;
    } catch (error) {
      console.error('AI element finding error:', error);
      return [];
    }
  }

  private async handleCookieBanner(): Promise<void> {
    if (!this.driver) return;

    console.log('🍪 AI search for cookie banner...');
    const cookieElements = await this.findElementsByAI('cookie_banner');

    if (cookieElements.length > 0) {
      try {
        await cookieElements[0].click();
        console.log('✅ Cookie banner handled by AI');
        await this.driver.sleep(1000);
      } catch (error) {
        console.log('⚠️ Could not click cookie banner');
      }
    }
  }

  private async fillSearchForm(specialty: string, location: string): Promise<boolean> {
    if (!this.driver) return false;

    console.log('🔍 AI search for form elements...');

    // Find inputs using AI
    const specialtyInputs = await this.findElementsByAI('search_specialty_input');
    const locationInputs = await this.findElementsByAI('search_location_input');
    const submitButtons = await this.findElementsByAI('search_submit_button');

    // Fill specialty
    if (specialtyInputs.length > 0) {
      try {
        await specialtyInputs[0].clear();
        await specialtyInputs[0].sendKeys(specialty);
        console.log('✅ Specialty filled by AI');
      } catch (error) {
        console.log('⚠️ Could not fill specialty');
      }
    }

    // Fill location
    if (locationInputs.length > 0) {
      try {
        await locationInputs[0].clear();
        await locationInputs[0].sendKeys(location);
        console.log('✅ Location filled by AI');
      } catch (error) {
        console.log('⚠️ Could not fill location');
      }
    }

    await this.driver.sleep(1000);

    // Submit search
    if (submitButtons.length > 0) {
      try {
        await submitButtons[0].click();
        console.log('✅ Search submitted by AI');
        return true;
      } catch (error) {
        console.log('⚠️ Could not click submit');
      }
    }

    // Fallback
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

  private async extractDoctorsWithAI(maxResults: number = 10): Promise<any[]> {
    if (!this.driver) return [];

    console.log('🤖 AI-powered doctor extraction...');

    try {
      await this.driver.sleep(3000);

      // Get page HTML for AI analysis
      const pageSource = await this.driver.getPageSource();

      // Use AI to find doctor result containers
      const analysisResult = await this.htmlAnalysisService.analyzeFullPage(pageSource);

      console.log(`🎯 AI found ${analysisResult.resultContainers.length} potential doctor containers`);

      const doctors = [];

      // Process each container found by AI
      for (let i = 0; i < Math.min(analysisResult.resultContainers.length, maxResults); i++) {
        const containerAnalysis = analysisResult.resultContainers[i];

        try {
          // Find the actual element
          const elements = await this.driver.findElements(By.css(containerAnalysis.selector));
          if (elements.length === 0) continue;

          const element = elements[0];
          const text = await element.getText();

          // Skip irrelevant content
          if (this.isIrrelevantContent(text)) continue;

          // Extract link
          let link = 'https://www.doctolib.fr/';
          try {
            const linkElement = await element.findElement(By.css('a'));
            const href = await linkElement.getAttribute('href');
            if (href) link = href;
          } catch (e) {
            // Use default link
          }

          // Parse doctor data using AI-enhanced logic
          const doctorData = await this.parseDoctorWithAI(text, link);
          if (doctorData) {
            doctors.push({
              id: 'ai_' + i + '_' + Date.now(),
              ...doctorData
            });
          }

        } catch (error) {
          console.warn(`Failed to process container ${i}:`, error);
        }
      }

      console.log(`✅ AI extracted ${doctors.length} valid doctors`);
      return doctors;

    } catch (error) {
      console.error('AI extraction error:', error);
      return [];
    }
  }

  private isIrrelevantContent(text: string): boolean {
    const irrelevantPatterns = [
      /aller au contenu/i,
      /menu|navigation/i,
      /infirmier|secrétaire/i,
      /consultation vidéo|téléconsultation/i,
      /rechercher|filtrer/i
    ];

    return irrelevantPatterns.some(pattern => pattern.test(text)) || text.length < 50;
  }

  private async parseDoctorWithAI(text: string, link: string): Promise<any | null> {
    try {
      // Enhanced name extraction with multiple patterns
      let name = null;
      const namePatterns = [
        /(?:Dr\.?\s+|Docteur\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*-\s*(?:Dr|Docteur)/i,
        /(?:Dr\.?\s*|Docteur\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
      ];

      for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match && match[1] && this.isValidDoctorName(match[1])) {
          name = 'Dr. ' + match[1];
          break;
        }
      }

      if (!name) return null;

      // Extract specialty
      const specialty = this.extractSpecialty(text);

      // Extract address
      const address = this.extractAddress(text);

      // Extract availability
      const availabilities = this.extractAvailability(text);

      return {
        name,
        specialty: specialty || 'Spécialité non spécifiée',
        address: address || 'Adresse non disponible',
        link,
        availabilities,
        next_availability: availabilities[0] || null,
        rawText: text.substring(0, 300)
      };

    } catch (error) {
      console.error('AI parsing error:', error);
      return null;
    }
  }

  private isValidDoctorName(name: string): boolean {
    // Filter out invalid names
    const invalidPatterns = [
      /infirmier/i,
      /secrétaire/i,
      /assistant/i,
      /menu/i,
      /navigation/i,
      /vidéo/i,
      /consultation/i,
      /^\d+$/, // Only numbers
      /^.{1,2}$/ // Too short
    ];

    return !invalidPatterns.some(pattern => pattern.test(name)) &&
           name.length >= 3 && name.length <= 50 &&
           /[A-Z]/.test(name); // Must contain uppercase letter
  }

  private extractSpecialty(text: string): string | null {
    const specialties = [
      'cardiologue', 'dentiste', 'médecin généraliste', 'gynécologue',
      'dermatologue', 'ophtalmologue', 'pédiatre', 'psychiatre',
      'chirurgien', 'radiologue', 'neurologue', 'rhumatologue'
    ];

    for (const specialty of specialties) {
      if (text.toLowerCase().includes(specialty)) {
        return specialty;
      }
    }

    return null;
  }

  private extractAddress(text: string): string | null {
    // Enhanced address patterns
    const addressPatterns = [
      /(\d+[^,]*(?:rue|avenue|boulevard|place|allée|impasse)[^,]*(?:,\s*\d{5}[^,]*)?)/i,
      /(paris|lyon|marseille|lille|toulouse|nice|nantes|montpellier|strasbourg|rennes)\s*\d{5}/i,
      /(\d{1,4}[^,]*,?\s*(?:rue|avenue|boulevard)[^,]*,?\s*\d{5})/i
    ];

    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractAvailability(text: string): string[] {
    const availabilityPatterns = [
      /aujourd'hui|demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche/gi,
      /dans\s+\d+\s+jours?/gi,
      /prochaine disponibilité/gi
    ];

    const availabilities: string[] = [];

    for (const pattern of availabilityPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        availabilities.push(...matches);
      }
    }

    return [...new Set(availabilities)]; // Remove duplicates
  }

  public async searchDoctors(params: DoctolibSearchParams, maxResults: number = 10): Promise<DoctolibDoctor[]> {
    try {
      console.log('🚀 Starting AI-powered Doctolib search...');
      console.log(`🔍 AI searching for ${params.specialty} in ${params.location}`);

      await this.initDriver();
      console.log('✅ AI driver initialized');

      await this.driver!.get('https://www.doctolib.fr/');
      console.log('✅ Navigated to Doctolib');

      await this.handleCookieBanner();

      const searchSuccess = await this.fillSearchForm(params.specialty, params.location);
      if (!searchSuccess) {
        throw new Error('AI could not submit search form');
      }

      const rawResults = await this.extractDoctorsWithAI(maxResults);

      // Convert to DoctolibDoctor format
      const doctors: DoctolibDoctor[] = rawResults.map((result: any) => ({
        id: result.id,
        name: result.name,
        specialty: result.specialty,
        address: result.address,
        phone: undefined,
        availability: result.availabilities,
        doctolibUrl: result.link,
        next_availability: result.next_availability
      }));

      console.log(`✅ AI search completed. Found ${doctors.length} doctors`);
      return doctors;

    } catch (error) {
      console.error('❌ AI search error:', error);
      throw error;
    } finally {
      await this.closeDriver();
      console.log('🛑 AI driver closed');
    }
  }
}
