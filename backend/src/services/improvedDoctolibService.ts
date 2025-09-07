import { Builder, By, WebDriver, WebElement } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { HtmlAnalysisService } from './htmlAnalysisService';
import { RealAIDoctorExtractor } from './realAiDoctorExtractor';
import * as fs from 'fs';
import * as path from 'path';

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

export class ImprovedDoctolibService {
  private driver: WebDriver | null = null;
  private htmlAnalysisService: HtmlAnalysisService;
  private realAiDoctorExtractor: RealAIDoctorExtractor;

  constructor() {
    this.htmlAnalysisService = new HtmlAnalysisService();
    this.realAiDoctorExtractor = new RealAIDoctorExtractor();
    this.ensureLogsDirectory();
  }

  private ensureLogsDirectory(): void {
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  private async savePageHTML(stepName: string, url?: string): Promise<void> {
    if (!this.driver) return;

    try {
      const pageSource = await this.driver.getPageSource();
      const currentUrl = url || await this.driver.getCurrentUrl();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${timestamp}_${stepName}.html`;
      const filepath = path.join(__dirname, '../../logs', filename);

      const htmlContent = `
<!-- URL: ${currentUrl} -->
<!-- Step: ${stepName} -->
<!-- Timestamp: ${new Date().toISOString()} -->
${pageSource}
      `;

      fs.writeFileSync(filepath, htmlContent, 'utf8');
      console.log(`📄 Saved HTML log: ${filename}`);
    } catch (error) {
      console.error('Error saving HTML log:', error);
    }
  }

  private async initDriver(): Promise<WebDriver> {
    const chromeOptions = new ChromeOptions();
    
    // Антидетект настройки для обхода защиты Doctolib
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-gpu');
    chromeOptions.addArguments('--window-size=1920,1080');
    chromeOptions.addArguments('--start-maximized');
    
    // Реалистичный User-Agent
    chromeOptions.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Отключаем автоматизацию флаги
    chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
    chromeOptions.addArguments('--disable-extensions');
    chromeOptions.addArguments('--disable-plugins');
    chromeOptions.addArguments('--disable-images'); // Ускоряет загрузку
    
    // Настройки для обхода детекции
    chromeOptions.excludeSwitches('enable-automation');
    chromeOptions.addArguments('--disable-web-security');
    chromeOptions.addArguments('--allow-running-insecure-content');
    
    // Дополнительные флаги для обхода детекции
    chromeOptions.addArguments('--disable-features=VizDisplayCompositor');
    chromeOptions.addArguments('--disable-ipc-flooding-protection');
    chromeOptions.addArguments('--disable-renderer-backgrounding');
    chromeOptions.addArguments('--disable-backgrounding-occluded-windows');
    chromeOptions.addArguments('--disable-client-side-phishing-detection');
    chromeOptions.addArguments('--disable-sync');
    chromeOptions.addArguments('--disable-default-apps');
    chromeOptions.addArguments('--no-first-run');
    chromeOptions.addArguments('--no-default-browser-check');
    
    // Прокси ротация (опционально)
    // chromeOptions.addArguments('--proxy-server=http://proxy:port');

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();

    // Расширенное скрытие следов автоматизации
    await this.driver.executeScript(`
      // Основные переопределения
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Переопределяем navigator.plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' }
        ],
      });
      
      // Переопределяем navigator.languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['fr-FR', 'fr', 'en-US', 'en'],
      });
      
      // Добавляем реалистичные свойства
      Object.defineProperty(navigator, 'permissions', {
        get: () => ({
          query: () => Promise.resolve({ state: 'granted' }),
        }),
      });
      
      // Скрываем Chrome automation
      window.chrome = {
        runtime: {},
        loadTimes: function() {
          return {
            commitLoadTime: Date.now() - Math.random() * 1000,
            finishDocumentLoadTime: Date.now() - Math.random() * 500,
            finishLoadTime: Date.now() - Math.random() * 200,
            firstPaintAfterLoadTime: Date.now() - Math.random() * 100,
            firstPaintTime: Date.now() - Math.random() * 50,
            navigationType: 'navigate',
            npnNegotiatedProtocol: 'h2',
            requestTime: Date.now() - Math.random() * 2000,
            startLoadTime: Date.now() - Math.random() * 1500,
            wasAlternateProtocolAvailable: false,
            wasFetchedViaSpdy: true,
            wasNpnNegotiated: true
          };
        },
        csi: function() {
          return {
            onloadT: Date.now(),
            pageT: Math.random() * 1000,
            startE: Date.now() - Math.random() * 2000,
            tran: Math.floor(Math.random() * 20)
          };
        }
      };
      
      // Переопределяем screen properties
      Object.defineProperty(screen, 'colorDepth', {
        get: () => 24,
      });
      
      // Добавляем реалистичные timing API
      Object.defineProperty(window.performance, 'timing', {
        get: () => ({
          connectEnd: Date.now() - Math.random() * 100,
          connectStart: Date.now() - Math.random() * 200,
          domComplete: Date.now() - Math.random() * 50,
          domContentLoadedEventEnd: Date.now() - Math.random() * 75,
          domContentLoadedEventStart: Date.now() - Math.random() * 100,
          domInteractive: Date.now() - Math.random() * 125,
          domLoading: Date.now() - Math.random() * 150,
          domainLookupEnd: Date.now() - Math.random() * 175,
          domainLookupStart: Date.now() - Math.random() * 200,
          fetchStart: Date.now() - Math.random() * 225,
          loadEventEnd: Date.now() - Math.random() * 25,
          loadEventStart: Date.now() - Math.random() * 50,
          navigationStart: Date.now() - Math.random() * 250,
          redirectEnd: 0,
          redirectStart: 0,
          requestStart: Date.now() - Math.random() * 125,
          responseEnd: Date.now() - Math.random() * 75,
          responseStart: Date.now() - Math.random() * 100,
          secureConnectionStart: Date.now() - Math.random() * 150,
          unloadEventEnd: Date.now() - Math.random() * 200,
          unloadEventStart: Date.now() - Math.random() * 225
        })
      });
      
      // Переопределяем Date для более реалистичного поведения
      const originalDate = Date;
      Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) {
            super(originalDate.now() + Math.random() * 10 - 5);
          } else {
            super(...args);
          }
        }
        static now() {
          return originalDate.now() + Math.random() * 10 - 5;
        }
      };
    `);

    return this.driver;
  }

  private async closeDriver(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }

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

  private async humanDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.driver?.sleep(delay);
  }

  private async humanTypeText(element: WebElement, text: string): Promise<void> {
    await element.clear();
    
    // Печатаем по символам с случайными задержками
    for (const char of text) {
      await element.sendKeys(char);
      await this.driver?.sleep(Math.random() * 200 + 50); // 50-250ms между символами
    }
    
    await this.humanDelay(500, 1500);
  }

  private async handleCookieBanner(): Promise<void> {
    if (!this.driver) return;

    console.log('🍪 Looking for "Agree and Close" button...');
    await this.savePageHTML('01_initial_page');
    
    // Ждем загрузки страницы
    await this.humanDelay(3000, 5000);
    
    try {
      // Ищем кнопку "Agree and Close" динамически
      const foundButton = await this.driver.executeScript(`
        function findAgreeButton() {
          // Получаем все кнопки на странице
          const allButtons = Array.from(document.querySelectorAll('button, [role="button"], input[type="button"]'));
          
          for (const button of allButtons) {
            const buttonText = (button.textContent || '').toLowerCase().trim();
            const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
            const title = (button.getAttribute('title') || '').toLowerCase();
            
            const allText = buttonText + ' ' + ariaLabel + ' ' + title;
            
            // Проверяем видимость
            const rect = button.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0 && 
                            window.getComputedStyle(button).display !== 'none';
            
            if (!isVisible) continue;
            
            // Ищем точно "agree and close" или похожие варианты
            if (allText.includes('agree and close') || 
                allText.includes('accepter et fermer') ||
                allText.includes('accept and close') ||
                (allText.includes('agree') && allText.includes('close')) ||
                (allText.includes('accept') && allText.includes('close'))) {
              return button;
            }
          }
          
          // Если не нашли точное совпадение, ищем просто "agree" или "accept"
          for (const button of allButtons) {
            const buttonText = (button.textContent || '').toLowerCase().trim();
            const rect = button.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            
            if (isVisible && (buttonText.includes('agree') || buttonText.includes('accept') || buttonText.includes('accepter'))) {
              return button;
            }
          }
          
          return null;
        }
        
        return findAgreeButton();
      `);

      if (foundButton) {
        console.log('✅ Found "Agree and Close" button');
        
        // Скроллим к кнопке и кликаем через JavaScript
        await this.driver.executeScript(`
          arguments[0].scrollIntoView({behavior: "smooth", block: "center"});
          setTimeout(() => arguments[0].click(), 1000);
        `, foundButton);
        
        console.log('✅ Clicked "Agree and Close" button');
        await this.humanDelay(2000, 3000);
        await this.savePageHTML('02_after_cookies');
        return;
      }

      console.log('⚠️ "Agree and Close" button not found');
      
    } catch (error) {
      console.log('⚠️ Error finding cookie button:', error);
    }
  }

  private async fillSearchForm(specialty: string, location: string): Promise<boolean> {
    if (!this.driver) return false;

    console.log('🔍 Filling search form...');

    const specialtyInputs = await this.findElementsByAI('search_specialty_input');
    const locationInputs = await this.findElementsByAI('search_location_input');
    const submitButtons = await this.findElementsByAI('search_submit_button');

    if (specialtyInputs.length > 0) {
      try {
        await specialtyInputs[0].clear();
        await specialtyInputs[0].sendKeys(specialty);
        console.log('✅ Specialty filled');
      } catch (error) {
        console.log('⚠️ Could not fill specialty');
      }
    }

    if (locationInputs.length > 0) {
      try {
        await locationInputs[0].clear();
        await locationInputs[0].sendKeys(location);
        console.log('✅ Location filled');
      } catch (error) {
        console.log('⚠️ Could not fill location');
      }
    }

    await this.driver.sleep(1000);
    await this.savePageHTML('03_form_filled');

    if (submitButtons.length > 0) {
      try {
        await submitButtons[0].click();
        console.log('✅ Search submitted');
        await this.driver.sleep(3000);
        await this.savePageHTML('04_search_results');
        return true;
      } catch (error) {
        console.log('⚠️ Could not click submit');
      }
    }

    if (locationInputs.length > 0) {
      try {
        await locationInputs[0].sendKeys('\n');
        console.log('✅ Search submitted via Enter');
        await this.driver.sleep(3000);
        await this.savePageHTML('04_search_results');
        return true;
      } catch (error) {
        console.log('⚠️ Could not submit via Enter');
      }
    }

    return false;
  }

  private async extractDoctorsImproved(maxResults: number = 10): Promise<any[]> {
    if (!this.driver) return [];

    console.log('🤖 Extracting doctors using AI without hardcoded patterns...');

    try {
      await this.driver.sleep(3000);

      // Get page HTML and save it for analysis
      const pageSource = await this.driver.getPageSource();
      await this.savePageHTML('05_before_extraction');

      // Use AI extractor to analyze the HTML
      const searchParams = { specialty: 'doctor', location: 'Paris' }; // Will be passed from main method
      const aiResults = await this.realAiDoctorExtractor.extractDoctorsFromHTML(pageSource, searchParams);

      if (aiResults && aiResults.length > 0) {
        console.log(`✅ AI extraction found ${aiResults.length} doctors`);
        return aiResults.slice(0, maxResults);
      }

      console.log('⚠️ AI extraction found no results, trying fallback');
      return await this.fallbackExtraction(maxResults);

    } catch (error) {
      console.error('AI extraction error:', error);
      return await this.fallbackExtraction(maxResults);
    }
  }

  private async fallbackExtraction(maxResults: number): Promise<any[]> {
    console.log('🔄 Using fallback extraction method...');
    
    try {
      const doctors: any = await this.driver!.executeScript(`
        function fallbackExtraction() {
          const doctors = [];
          
          // Get all potential containers
          const allElements = Array.from(document.querySelectorAll('div, article, section, li'));
          
          for (const element of allElements) {
            if (doctors.length >= ${maxResults}) break;
            
            const text = element.textContent || '';
            if (text.length < 100) continue;
            
            // Check if this looks like a doctor result
            const hasLink = element.querySelector('a[href]');
            const hasName = /dr\.?\s+[a-z]+|docteur\s+[a-z]+/i.test(text);
            const hasSpecialty = /cardiologue|dentiste|médecin|gynécologue|dermatologue|ophtalmologue/i.test(text);
            const hasAddress = /rue|avenue|boulevard|paris|lyon|marseille|\d{5}/i.test(text);
            
            if (!hasLink || (!hasName && !hasSpecialty)) continue;
            
            // Skip navigation elements
            if (text.includes('aller au contenu') || text.includes('menu') || 
                text.includes('navigation') || text.includes('filtrer')) {
              continue;
            }
            
            // Extract basic info
            let name = null;
            const nameMatch = text.match(/(?:Dr\.?\s+|Docteur\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            if (nameMatch) {
              name = nameMatch[0];
            }
            
            let specialty = null;
            const specialties = ['cardiologue', 'dentiste', 'médecin généraliste', 'gynécologue'];
            for (const spec of specialties) {
              if (text.toLowerCase().includes(spec)) {
                specialty = spec;
                break;
              }
            }
            
            let address = null;
            const addressMatch = text.match(/(\d+[^,]*(?:rue|avenue|boulevard)[^,]*)/i);
            if (addressMatch) {
              address = addressMatch[1].trim();
            }
            
            let link = null;
            const linkEl = element.querySelector('a[href]');
            if (linkEl) {
              const href = linkEl.getAttribute('href');
              if (href && href.includes('doctolib')) {
                link = href.startsWith('http') ? href : 'https://www.doctolib.fr' + href;
              }
            }
            
            if (name || (specialty && address)) {
              doctors.push({
                id: 'fallback_' + Date.now() + '_' + Math.random(),
                name: name || 'Docteur',
                specialty: specialty || 'Spécialité non spécifiée',
                address: address || 'Adresse non disponible',
                link: link || 'https://www.doctolib.fr/',
                availabilities: [],
                next_availability: null
              });
            }
          }
          
          return doctors;
        }
        
        return fallbackExtraction();
      `);

      console.log(`🔄 Fallback extraction found ${doctors.length} doctors`);
      return doctors || [];

    } catch (error) {
      console.error('Fallback extraction error:', error);
      return [];
    }
  }

  private isIrrelevantContent(text: string): boolean {
    const irrelevantPatterns = [
      /aller au contenu/i,
      /menu/i,
      /navigation/i,
      /filtrer/i,
      /rechercher/i,
      /consultation vidéo/i,
      /téléconsultation/i,
      /infirmier/i,
      /secrétaire/i
    ];

    return irrelevantPatterns.some(pattern => pattern.test(text));
  }

  private async parseDoctorWithAI(text: string, link: string): Promise<any | null> {
    try {
      console.log(`    🔍 Parsing doctor from text: ${text.substring(0, 100)}...`);
      
      // Enhanced name extraction with multiple strategies
      let name = null;
      
      // Strategy 1: Look for proper names with Dr/Docteur prefix
      const namePatterns = [
        /(?:Dr\.?\s+|Docteur\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*-\s*(?:Dr|Docteur)/i,
        // Look for names in specific contexts
        /Prendre rendez-vous avec\s+(?:Dr\.?\s+|Docteur\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
        /Rendez-vous\s+(?:Dr\.?\s+|Docteur\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
      ];

      for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match && match[1] && match[1].length > 2) {
          const candidateName = match[1].trim();
          console.log(`    Found name candidate: ${candidateName}`);
          
          // Validate the name
          if (this.isValidDoctorName(candidateName)) {
            name = candidateName.startsWith('Dr') ? candidateName : 'Dr. ' + candidateName;
            console.log(`    ✅ Valid name: ${name}`);
            break;
          } else {
            console.log(`    ❌ Invalid name: ${candidateName}`);
          }
        }
      }

      // Strategy 2: If no name found, look for names in structured elements
      if (!name) {
        // Look for capitalized words that could be names
        const words = text.split(/\s+/);
        const capitalizedWords = words.filter(word => 
          /^[A-Z][a-z]{2,}$/.test(word) && 
          !this.isCommonWord(word)
        );
        
        if (capitalizedWords.length >= 2) {
          const candidateName = capitalizedWords.slice(0, 2).join(' ');
          if (this.isValidDoctorName(candidateName)) {
            name = 'Dr. ' + candidateName;
            console.log(`    ✅ Found name from capitalized words: ${name}`);
          }
        }
      }

      if (!name) {
        console.log(`    ❌ No valid name found`);
        return null;
      }

      // Extract specialty with enhanced patterns
      let specialty = null;
      const specialties = [
        'cardiologue', 'dentiste', 'médecin généraliste', 'gynécologue',
        'dermatologue', 'ophtalmologue', 'pédiatre', 'psychiatre',
        'chirurgien-dentiste', 'sage-femme', 'kinésithérapeute',
        'ostéopathe', 'psychologue', 'orthophoniste'
      ];
      
      for (const spec of specialties) {
        if (text.toLowerCase().includes(spec)) {
          specialty = spec;
          console.log(`    ✅ Found specialty: ${specialty}`);
          break;
        }
      }

      // Extract address with enhanced patterns
      let address = null;
      const addressPatterns = [
        /(\d+[^,\n]*(?:rue|avenue|boulevard|place|allée|impasse)[^,\n]*(?:,\s*\d{5}[^,\n]*)?)/i,
        /((?:rue|avenue|boulevard|place|allée|impasse)[^,\n]*(?:,\s*\d{5}[^,\n]*)?)/i,
        /(\d{5}\s+[A-Z][a-z]+)/i
      ];

      for (const pattern of addressPatterns) {
        const match = text.match(pattern);
        if (match) {
          address = match[1].trim();
          console.log(`    ✅ Found address: ${address}`);
          break;
        }
      }

      // Extract availability information
      const availabilities = [];
      const availPatterns = [
        /aujourd'hui|demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche/gi,
        /dans\s+\d+\s+jours?/gi,
        /prochaine disponibilité/gi,
        /disponible/gi
      ];

      for (const pattern of availPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          availabilities.push(...matches);
        }
      }

      const result = {
        name,
        specialty: specialty || 'Spécialité non spécifiée',
        address: address || 'Adresse non disponible',
        link,
        availabilities: [...new Set(availabilities)],
        next_availability: availabilities[0] || null
      };

      console.log(`    ✅ Parsed doctor:`, result);
      return result;

    } catch (error) {
      console.error('AI parsing error:', error);
      return null;
    }
  }

  private isValidDoctorName(name: string): boolean {
    if (!name || name.length < 3 || name.length > 50) return false;
    
    const invalidPatterns = [
      /infirmier/i, /secrétaire/i, /assistant/i, /menu/i,
      /navigation/i, /vidéo/i, /consultation/i, /aller au contenu/i,
      /rechercher/i, /filtrer/i, /^\d+$/, /paris/i, /lyon/i,
      /marseille/i, /toulouse/i, /nice/i, /nantes/i,
      /chirurgien-dentiste/i, /médecin généraliste/i, /cardiologue/i,
      /dentiste/i, /gynécologue/i, /dermatologue/i, /ophtalmologue/i
    ];
    
    return !invalidPatterns.some(pattern => pattern.test(name)) && 
           /^[A-Z]/.test(name) && 
           !/^\d/.test(name);
  }

  private isCommonWord(word: string): boolean {
    const commonWords = [
      'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes',
      'Lille', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Rennes',
      'Reims', 'Le', 'La', 'Les', 'Du', 'De', 'Des', 'Et', 'Ou',
      'Avec', 'Pour', 'Dans', 'Sur', 'Sous', 'Chez', 'Vers',
      'Rendez', 'Vous', 'Prendre', 'Consultation', 'Vidéo'
    ];
    
    return commonWords.includes(word);
  }

  private isValidDoctorData(data: any): boolean {
    if (!data || !data.name) return false;
    
    const invalidNames = [
      'aller au contenu',
      'menu',
      'navigation',
      'infirmier',
      'secrétaire',
      'consultation vidéo',
      'téléconsultation'
    ];

    return !invalidNames.some(invalid => 
      data.name.toLowerCase().includes(invalid)
    );
  }

  private async bypassAntiBot(): Promise<void> {
    if (!this.driver) return;

    console.log('🛡️ Bypassing anti-bot protection...');

    // Добавляем случайные движения мыши
    await this.driver.executeScript(`
      // Симулируем движения мыши
      function simulateMouseMovement() {
        const events = ['mousemove', 'mouseenter', 'mouseover'];
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            const event = new MouseEvent(events[Math.floor(Math.random() * events.length)], {
              clientX: x,
              clientY: y,
              bubbles: true
            });
            document.dispatchEvent(event);
          }, i * 200);
        }
      }
      
      // Симулируем скроллинг
      function simulateScrolling() {
        const scrollAmount = Math.random() * 200 + 100;
        window.scrollBy(0, scrollAmount);
        setTimeout(() => window.scrollBy(0, -scrollAmount/2), 500);
      }
      
      // Добавляем реалистичные события
      function addRealisticBehavior() {
        // Фокус на окне
        window.focus();
        
        // Случайные клики в безопасных местах
        setTimeout(() => {
          const safeElements = document.querySelectorAll('body, html');
          if (safeElements.length > 0) {
            const event = new MouseEvent('click', { bubbles: true });
            safeElements[0].dispatchEvent(event);
          }
        }, Math.random() * 1000 + 500);
      }
      
      simulateMouseMovement();
      simulateScrolling();
      addRealisticBehavior();
    `);

    // Случайная задержка для имитации человеческого поведения
    await this.humanDelay(2000, 5000);

    // Проверяем наличие капчи или блокировки
    try {
      const captchaElements = await this.driver.findElements(By.css('[class*="captcha"], [id*="captcha"], [class*="recaptcha"], [id*="recaptcha"]'));
      if (captchaElements.length > 0) {
        console.log('⚠️ CAPTCHA detected - waiting for manual resolution or retry');
        await this.humanDelay(10000, 15000);
      }
    } catch (error) {
      // Продолжаем
    }

    console.log('✅ Anti-bot bypass completed');
  }

  private async rotateUserAgent(): Promise<void> {
    if (!this.driver) return;

    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];

    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    await this.driver.executeScript(`
      Object.defineProperty(navigator, 'userAgent', {
        get: () => '${randomUA}',
        configurable: true
      });
    `);
  }

  public async searchDoctors(params: DoctolibSearchParams, maxResults: number = 10): Promise<DoctolibDoctor[]> {
    try {
      console.log('🚀 Starting improved Doctolib search...');
      console.log(`🔍 Searching for ${params.specialty} in ${params.location}`);

      await this.initDriver();
      console.log('✅ Driver initialized');

      // Ротация User-Agent
      await this.rotateUserAgent();

      await this.driver!.get('https://www.doctolib.fr/');
      console.log('✅ Navigated to Doctolib');

      // Обход анти-бот защиты
      await this.bypassAntiBot();

      await this.handleCookieBanner();

      const searchSuccess = await this.fillSearchForm(params.specialty, params.location);
      if (!searchSuccess) {
        throw new Error('Could not submit search form');
      }

      // Передаем параметры поиска в AI экстрактор
      const rawResults = await this.extractDoctorsImprovedWithParams(params, maxResults);

      const doctors: DoctolibDoctor[] = rawResults.map((result: any) => ({
        id: result.id,
        name: result.name,
        specialty: result.specialty,
        address: result.address,
        phone: undefined,
        availability: result.availability || result.availabilities || [],
        doctolibUrl: result.link || result.doctolibUrl || 'https://www.doctolib.fr/',
        next_availability: result.next_availability
      }));

      console.log(`✅ Improved search completed. Found ${doctors.length} doctors`);
      return doctors;

    } catch (error) {
      console.error('❌ Improved search error:', error);
      throw error;
    } finally {
      await this.closeDriver();
      console.log('🛑 Driver closed');
    }
  }

  private async extractDoctorsImprovedWithParams(params: DoctolibSearchParams, maxResults: number = 10): Promise<any[]> {
    if (!this.driver) return [];

    console.log('🤖 Extracting doctors using AI without hardcoded patterns...');

    try {
      await this.driver.sleep(3000);

      // Get page HTML and save it for analysis
      const pageSource = await this.driver.getPageSource();
      await this.savePageHTML('05_before_extraction');

      // Use Real AI extractor to analyze the HTML with actual search parameters
      const aiResults = await this.realAiDoctorExtractor.extractDoctorsFromHTML(pageSource, params);

      if (aiResults && aiResults.length > 0) {
        console.log(`✅ AI extraction found ${aiResults.length} doctors`);
        return aiResults.slice(0, maxResults);
      }

      console.log('⚠️ AI extraction found no results, trying fallback');
      return await this.fallbackExtraction(maxResults);

    } catch (error) {
      console.error('AI extraction error:', error);
      return await this.fallbackExtraction(maxResults);
    }
  }
}
