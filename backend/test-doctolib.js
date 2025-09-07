const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function testDoctolib() {
  console.log('🔍 Testing Doctolib with Selenium...');
  
  let driver;
  try {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    
    console.log('📦 Creating WebDriver...');
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    console.log('🌐 Navigating to Doctolib...');
    await driver.get('https://www.doctolib.fr/');
    
    console.log('📄 Getting page title...');
    const title = await driver.getTitle();
    console.log('✅ Page title:', title);
    
    // Wait for page to load
    await driver.sleep(3000);
    
    console.log('🍪 Looking for cookie banner...');
    try {
      const cookieButton = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(), 'Agree and close')]")), 
        5000
      );
      await cookieButton.click();
      console.log('✅ Cookie banner accepted');
      await driver.sleep(1000);
    } catch (error) {
      console.log('ℹ️ No cookie banner found or already accepted');
    }
    
    console.log('🔍 Looking for search fields...');
    
    // Try to find specialty field
    const specialtySelectors = [
      'input[name="searchbar-query"]',
      'input.searchbar-query-input',
      'input[placeholder*="spécialité"]'
    ];
    
    let specialtyField = null;
    for (const selector of specialtySelectors) {
      try {
        specialtyField = await driver.findElement(By.css(selector));
        console.log(`✅ Found specialty field with selector: ${selector}`);
        break;
      } catch (error) {
        console.log(`❌ Selector ${selector} not found`);
      }
    }
    
    if (specialtyField) {
      await specialtyField.sendKeys('Cardiologue');
      console.log('✅ Specialty field filled');
    }
    
    // Try to find location field
    const locationSelectors = [
      'input[name="searchbar-location"]',
      'input.searchbar-place-input',
      'input[placeholder*="Où"]'
    ];
    
    let locationField = null;
    for (const selector of locationSelectors) {
      try {
        locationField = await driver.findElement(By.css(selector));
        console.log(`✅ Found location field with selector: ${selector}`);
        break;
      } catch (error) {
        console.log(`❌ Selector ${selector} not found`);
      }
    }
    
    if (locationField) {
      await locationField.sendKeys('Paris');
      console.log('✅ Location field filled');
    }
    
    console.log('✅ Doctolib test completed successfully!');
    
  } catch (error) {
    console.error('❌ Doctolib test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    if (driver) {
      await driver.quit();
      console.log('🔒 Driver closed');
    }
  }
}

testDoctolib();
