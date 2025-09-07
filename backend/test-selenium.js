const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function testSelenium() {
  console.log('🔍 Testing Selenium setup...');
  
  let driver;
  try {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    
    console.log('📦 Creating WebDriver...');
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    console.log('🌐 Navigating to Google...');
    await driver.get('https://www.google.com');
    
    console.log('📄 Getting page title...');
    const title = await driver.getTitle();
    console.log('✅ Page title:', title);
    
    console.log('🔍 Looking for search box...');
    const searchBox = await driver.findElement(By.name('q'));
    await searchBox.sendKeys('test selenium');
    
    console.log('✅ Selenium is working correctly!');
    
  } catch (error) {
    console.error('❌ Selenium test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    if (driver) {
      await driver.quit();
      console.log('🔒 Driver closed');
    }
  }
}

testSelenium();
