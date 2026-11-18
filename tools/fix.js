// Recapture specific sites, clicking through age gates and dismissing popups first.
// Usage: node fix.js "Site Name" "Another Site"
const { chromium } = require('playwright-core');
const path = require('path');
const sites = require('./sites.json');
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ACCEPT = /^\s*(yes|enter|i am (over )?18|i'?m (over )?18|over 18|i am of legal|confirm)/i;
const DISMISS = /^\s*(no|no thanks|close|dismiss|maybe later|i understand|understood|continue|got it|ok|okay)\s*$/i;

async function dismissAll(page) {
  await clickByText(page, DISMISS);
  await page.keyboard.press('Escape').catch(() => {});
  for (const el of await page.$$('[aria-label*="close" i]:visible, button[class*="close" i]:visible, [data-framer-name*="close" i]:visible')) {
    await el.click({ timeout: 1500 }).catch(() => {});
  }
  await page.waitForTimeout(800);
}

async function clickByText(page, re) {
  for (const el of await page.$$('button:visible, a:visible, [role=button]:visible')) {
    const t = (await el.innerText().catch(() => '')).trim();
    if (t.length < 30 && re.test(t)) { await el.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(800); return true; }
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  for (const name of process.argv.slice(2)) {
    const site = sites.find(x => x.name === name);
    if (!site) { console.log('Not in sites.json:', name); continue; }
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();
    try {
      await page.goto(site.url, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(6000);
      await clickByText(page, ACCEPT);
      await dismissAll(page);
      for (let y = 0; y <= 2400; y += 450) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(350); }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(6000);
      await dismissAll(page);
      await page.waitForTimeout(1500);
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.screenshot({ path: path.join(__dirname, 'shots', slug(name) + '.png'), fullPage: true,
        clip: { x: 0, y: 0, width: 1440, height: Math.min(2400, Math.max(900, h)) } });
      console.log('OK  ' + name);
    } catch (e) {
      console.log('ERR ' + name + ' :: ' + String(e).split('\n')[0]);
    }
    await ctx.close();
  }
  await browser.close();
})();
