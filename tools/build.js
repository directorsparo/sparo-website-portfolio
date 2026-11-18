// Builds ../index.html and ../images/*.jpg from sites.json and shots/.
// Usage: node build.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const ROOT = path.join(DIR, '..');
const IMG = path.join(ROOT, 'images');
fs.mkdirSync(IMG, { recursive: true });

const sites = JSON.parse(fs.readFileSync(path.join(DIR, 'sites.json'), 'utf8'));
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const domain = u => u.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

// Sections with the most recent launches sit higher; Industrial and Agriculture stay at the bottom.
const CAT_ORDER = [
  'Ecommerce','Professional Services','Health & Wellness','Finance','Law',
  'Tourism, Hospo & Entertainment','Coaching & Personal Brands','Marketing','Photography',
  'Real Estate','Healthcare','Education','Creative & Design','Events',
  'Industrial','Agriculture'
];

// Resize each capture to a web JPEG; skip when the JPEG is newer than the capture.
const missing = [];
function image(site) {
  const src = path.join(DIR, 'shots', slug(site.name) + '.png');
  const out = path.join(IMG, slug(site.name) + '.jpg');
  if (fs.existsSync(src) && (!fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(src).mtimeMs)) {
    execFileSync('sips', ['--resampleWidth', '1100', '-s', 'format', 'jpeg', '-s', 'formatOptions', '60', src, '--out', out], { stdio: 'ignore' });
  }
  if (!fs.existsSync(out)) { missing.push(site.name); return null; }
  const info = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', out]).toString();
  const w = +info.match(/pixelWidth: (\d+)/)[1], h = +info.match(/pixelHeight: (\d+)/)[1];
  return { src: 'images/' + slug(site.name) + '.jpg', w, h };
}

const byCat = {};
for (const s of sites) (byCat[s.cat] = byCat[s.cat] || []).push(s);
const cats = CAT_ORDER.filter(c => byCat[c]);
const unknown = Object.keys(byCat).filter(c => !CAT_ORDER.includes(c));
if (unknown.length) throw new Error('Add to CAT_ORDER: ' + unknown.join(', '));

function card(site) {
  const img = image(site);
  const d = domain(site.url);
  const shot = img
    ? `<img src="${img.src}" width="${img.w}" height="${img.h}" alt="${esc(site.name)} homepage" loading="lazy" decoding="async">`
    : '<div class="ph">Preview coming soon</div>';
  return `
      <article class="card" data-name="${esc(site.name.toLowerCase())}" data-domain="${esc(d)}" data-platform="${esc(site.platform)}">
        <a class="frame" href="${esc(site.url)}" target="_blank" rel="noopener" aria-label="Open ${esc(site.name)} in a new tab">
          <span class="bar" aria-hidden="true"><i></i><i></i><i></i><span class="url">${esc(d)}</span></span>
          <span class="shot">${shot}</span>
          ${site.recent ? '<span class="new">New</span>' : ''}
        </a>
        <div class="meta">
          <div class="names">
            <a class="client" href="${esc(site.url)}" target="_blank" rel="noopener" tabindex="-1">${esc(site.name)}</a>
            <span class="sub">${esc(d)}${site.platform ? ` <span class="dot">·</span> ${esc(site.platform)}` : ''}</span>
          </div>
          <button class="copy" type="button" data-url="${esc(site.url)}" aria-label="Copy link to ${esc(site.name)}">Copy link</button>
        </div>
      </article>`;
}

let sections = '';
for (const cat of cats) {
  // newest launch first; undated sites keep their sites.json order after the dated ones.
  // A site's "sortAs" (same YYYY-MM format) overrides its launch date for placement only.
  const key = s => s.sortAs ?? s.launched ?? '';
  const list = [...byCat[cat]].sort((a, b) => key(b).localeCompare(key(a)));
  sections += `
    <section class="cat" data-cat="${esc(cat)}">
      <h2>${esc(cat)} <span class="count">${list.length}</span></h2>
      <div class="grid">${list.map(card).join('')}
      </div>
    </section>`;
}

const updated = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Sparo Studios Website Portfolio</title>
<style>
  /* Dark only, regardless of the viewer's device setting. */
  :root{
    color-scheme:dark;
    --paper:#161513; --ink:#EDEAE4; --sub:#9B968D; --line:#2C2A26; --card:#1F1D1A;
    --accent:#7FA98E; --accent-ink:#14231B; --chipbg:#242220; --barbg:#2A2825; --dots:#45423D;
    --shadow:0 1px 2px rgba(0,0,0,.4),0 10px 30px rgba(0,0,0,.35);
    --shadow-hi:0 2px 4px rgba(0,0,0,.45),0 18px 44px rgba(0,0,0,.5);
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
  .wrap{max-width:1320px;margin:0 auto;padding:0 40px}
  header.top{padding:56px 0 8px}
  header.top h1{font-size:34px;font-weight:650;letter-spacing:-.02em;line-height:1.15;margin:0 0 10px;text-wrap:balance}
  .copy:focus-visible,.frame:focus-visible{outline:2px solid var(--accent);outline-offset:3px}

  main{padding:8px 0 80px}
  .cat{margin-top:56px}
  .cat h2{display:flex;align-items:baseline;gap:10px;font-size:22px;font-weight:650;letter-spacing:-.01em;margin:0 0 20px;padding-bottom:12px;border-bottom:1px solid var(--line)}
  .cat h2 .count{font-size:14px;font-weight:500;color:var(--sub);font-variant-numeric:tabular-nums}
  .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:48px 40px}

  .card{display:flex;flex-direction:column;gap:14px;min-width:0}
  .frame{position:relative;display:block;border-radius:12px;overflow:hidden;background:var(--card);border:1px solid var(--line);box-shadow:var(--shadow);transition:box-shadow .25s ease, transform .25s ease;text-decoration:none}
  .frame:hover{box-shadow:var(--shadow-hi);transform:translateY(-2px)}
  .bar{display:flex;align-items:center;gap:6px;height:32px;padding:0 12px;background:var(--barbg);border-bottom:1px solid var(--line)}
  .bar i{width:9px;height:9px;border-radius:50%;background:var(--dots)}
  .bar .url{margin:0 auto;padding-right:39px;font-size:12px;color:var(--sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .shot{display:block;position:relative;aspect-ratio:16/10;overflow:hidden;background:var(--chipbg);container-type:size}
  .shot img{display:block;width:100%;height:auto;transform:translateY(0);transition:transform 4.5s cubic-bezier(.45,.05,.4,1)}
  .frame:hover .shot img,.frame:focus-visible .shot img{transform:translateY(calc(-100% + 100cqh));transition-duration:6s}
  .ph{display:flex;align-items:center;justify-content:center;height:100%;color:var(--sub);font-size:13px}
  .new{position:absolute;top:44px;left:12px;background:var(--accent);color:var(--accent-ink);font:600 11px/1 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:6px 9px;border-radius:6px}

  .meta{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:0 2px}
  .names{display:flex;flex-direction:column;gap:2px;min-width:0}
  .client{font-weight:600;font-size:18px;letter-spacing:-.01em;color:var(--ink);text-decoration:none}
  .client:hover{text-decoration:underline;text-underline-offset:3px}
  .sub{color:var(--sub);font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dot{padding:0 3px}
  .copy{flex:0 0 auto;border:1px solid var(--line);background:var(--card);color:var(--accent);font:500 13px/1 system-ui,sans-serif;cursor:pointer;padding:8px 11px;border-radius:7px;margin-top:2px}
  .copy:hover{border-color:var(--accent)}

  footer{padding:0 0 56px;color:var(--sub);font-size:12.5px}

  @media (max-width: 860px){
    .wrap{padding:0 16px}
    header.top{padding-top:36px}
    header.top h1{font-size:28px}
    .grid{grid-template-columns:1fr;gap:36px}
    .cat{margin-top:44px}
  }
  @media (prefers-reduced-motion: reduce){
    .frame,.shot img{transition:none}
    .frame:hover{transform:none}
    .frame:hover .shot img,.frame:focus-visible .shot img{transform:none}
  }
</style>
</head>
<body>
<div class="wrap">
  <header class="top">
    <h1>Sparo Studios Website Portfolio</h1>
  </header>

  <main>
    ${sections}
  </main>
  <footer>Sparo Studios internal, for the new business team. Last updated ${updated}.</footer>
</div>
<script>
  document.querySelectorAll('.copy').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.url).then(() => {
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = 'Copy link'; }, 1400);
      });
    });
  });
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'index.html'), html);
const imgBytes = fs.readdirSync(IMG).reduce((n, f) => n + fs.statSync(path.join(IMG, f)).size, 0);
console.log(`index.html written (${(html.length / 1024).toFixed(0)} KB), images ${(imgBytes / 1024 / 1024).toFixed(1)} MB, ${sites.length} sites`);
if (missing.length) console.log('missing previews:', missing.join(', '));
