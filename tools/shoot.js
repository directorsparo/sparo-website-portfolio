const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const OUT = path.join(DIR, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const sites = JSON.parse(fs.readFileSync(path.join(DIR, 'sites.json'), 'utf8'));

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  const CONC = 4;
  let idx = 0;

  async function worker() {
    while (idx < sites.length) {
      const i = idx++;
      const site = sites[i];
      const file = path.join(OUT, slug(site.name) + '.png');
      if (fs.existsSync(file)) { results.push({ name: site.name, ok: true, cached: true }); continue; }
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      });
      const page = await ctx.newPage();
      try {
        await page.goto(site.url, { waitUntil: 'load', timeout: 45000 });
        await page.waitForTimeout(4500); // let hero animations/lazy images settle
        // hide common cookie banners
        await page.addStyleTag({ content: '[id*="cookie"],[class*="cookie"],[id*="consent"],[class*="consent"],[class*="gdpr"]{display:none !important}' }).catch(()=>{});
        await page.waitForTimeout(300);
        await page.screenshot({ path: file, type: 'png' });
        results.push({ name: site.name, ok: true });
        console.log('OK  ' + site.name);
      } catch (e) {
        results.push({ name: site.name, ok: false, err: String(e).slice(0, 120) });
        console.log('ERR ' + site.name + ' :: ' + String(e).slice(0, 120));
      }
      await ctx.close();
    }
  }

  await Promise.all(Array.from({ length: CONC }, worker));
  await browser.close();
  fs.writeFileSync(path.join(DIR, 'shot-results.json'), JSON.stringify(results, null, 2));
  const fails = results.filter(r => !r.ok);
  console.log(`\nDone: ${results.length - fails.length}/${results.length} ok, ${fails.length} failed`);
})();
