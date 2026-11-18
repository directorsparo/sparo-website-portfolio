// For sites whose hero breaks when the page is scrolled before capture (hiding headers, background video).
// Waits at the top, closes popups, then captures. Usage: node still.js "Site Name" [--viewport]
const { chromium } = require('playwright-core');
const path = require('path');
const sites = require('./sites.json');
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const args = process.argv.slice(2);
const viewportOnly = args.includes('--viewport');
// --tall loads the page in a 2400px-high window so a full-length capture needs no relayout
const tall = args.includes('--tall');
const names = args.filter(a => !a.startsWith('--'));

const HIDE = `[class*="provesource" i],[id*="provesource" i],[class*="ps-notification" i],
  [class*="cookie" i],[id*="cookie" i],[aria-modal="true"]{display:none !important}`;

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  for (const name of names) {
    const site = sites.find(x => x.name === name);
    if (!site) { console.log('Not in sites.json:', name); continue; }
    const page = await browser.newPage({ viewport: { width: 1440, height: tall ? 2400 : 900 } });
    await page.goto(site.url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(12000);
    for (const el of await page.$$('button:visible, [role=button]:visible')) {
      const t = (await el.innerText().catch(() => '')).trim();
      if (/^(no|no thanks|close)$/i.test(t)) { await el.click({ timeout: 1500 }).catch(() => {}); break; }
    }
    await page.addStyleTag({ content: HIDE }).catch(() => {});
    // social-proof toasts ("Amanda purchased...") are fixed-position and come from third-party widgets
    await page.evaluate(() => {
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' && /purchased|signed up|recently/i.test(el.textContent || '') && el.textContent.length < 300) el.style.display = 'none';
      }
    }).catch(() => {});
    await page.waitForTimeout(1500);
    const h = viewportOnly ? 900 : Math.min(2400, await page.evaluate(() => document.documentElement.scrollHeight));
    await page.screenshot({ path: path.join(__dirname, 'shots', slug(name) + '.png'), fullPage: !viewportOnly && !tall,
      clip: { x: 0, y: 0, width: 1440, height: Math.max(900, h) } });
    console.log('OK  ' + name);
    await page.close();
  }
  await browser.close();
})();
