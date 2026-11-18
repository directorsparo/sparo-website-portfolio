// Usage: node shoot.js            -> captures any site missing from shots/
//        node shoot.js "Name" ...  -> recaptures just those sites
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const OUT = path.join(DIR, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const sites = JSON.parse(fs.readFileSync(path.join(DIR, 'sites.json'), 'utf8'));
const only = process.argv.slice(2);
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const W = 1440, H = 900, TALL = 2400;

const HIDE_CSS = `
  [id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i],[class*="gdpr" i],
  [class*="klaviyo" i][role="dialog"],[class*="needsclick"][role="dialog"],[aria-modal="true"],
  #shopify-pc__banner,.privy-popup-container,[class*="popup" i][class*="newsletter" i]
  { display:none !important; }`;

async function capture(browser, site) {
  const file = path.join(OUT, slug(site.name) + '.png');
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();
  try {
    await page.goto(site.url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(5000);
    // walk down the page so lazy images and scroll-reveal sections render, then return to top
    for (let y = 0; y <= TALL; y += 450) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(350); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.keyboard.press('Escape').catch(() => {});
    const closer = await page.$('[aria-label*="close" i]:visible');
    if (closer) await closer.click({ timeout: 2000 }).catch(() => {});
    await page.addStyleTag({ content: HIDE_CSS }).catch(() => {});
    await page.waitForTimeout(2500);
    const docH = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y: 0, width: W, height: Math.min(TALL, Math.max(H, docH)) } });
    console.log('OK  ' + site.name);
    return true;
  } catch (e) {
    console.log('ERR ' + site.name + ' :: ' + String(e).split('\n')[0].slice(0, 120));
    return false;
  } finally {
    await ctx.close();
  }
}

(async () => {
  const todo = sites.filter(s => only.length ? only.includes(s.name) : !fs.existsSync(path.join(OUT, slug(s.name) + '.png')));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  let i = 0, fails = [];
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (i < todo.length) { const s = todo[i++]; if (!(await capture(browser, s))) fails.push(s.name); }
  }));
  await browser.close();
  console.log(`\nDone: ${todo.length - fails.length}/${todo.length} captured` + (fails.length ? `; failed: ${fails.join(', ')}` : ''));
})();
