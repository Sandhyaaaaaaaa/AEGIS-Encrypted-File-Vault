const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  // Login
  await page.fill('input[type="email"]', 'test@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  
  await page.goto('http://localhost:3000/upload');
  
  // Set file
  const fileInput = await page.$('input[type="file"]');
  await fileInput.setInputFiles('d:/EncryptedFileVault/MCA Pro/secret.txt');
  
  // Fill passphrase
  await page.fill('input[type="password"]', 'My$ecur3K3y#2024!Vault');
  
  // Upload
  await page.click('text=Encrypt & Upload Securely');
  
  // Wait for error or success
  await page.waitForSelector('text=❌', { timeout: 5000 }).catch(() => {});
  const body = await page.textContent('body');
  if (body.includes('❌')) {
    const errorText = await page.textContent('span:has-text("❌") + span');
    console.log('ERROR IS:', errorText);
  } else {
    console.log('NO ERROR FOUND');
  }
  await browser.close();
})();
