const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const sites = JSON.parse(fs.readFileSync(path.join(DIR, 'sites.json'), 'utf8'));
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CAT_ORDER = [
  'Law','Finance','Professional Services','Marketing','Recruitment','Real Estate',
  'Coaching & Personal Brands','Health & Wellness','Healthcare','Events',
  'Tourism, Hospo & Entertainment','Food','Ecommerce','Framer/Shopify','Fashion','Industrial',
  'Agriculture','Photography','Copywriting','Creative & Design','Education'
];

const byCat = {};
for (const s of sites) (byCat[s.cat] = byCat[s.cat] || []).push(s);
const cats = CAT_ORDER.filter(c => byCat[c]);

let missing = [];
function imgTag(site) {
  const f = path.join(DIR, 'thumbs', slug(site.name) + '.jpg');
  if (!fs.existsSync(f)) { missing.push(site.name); return '<div class="ph">No preview yet</div>'; }
  const b64 = fs.readFileSync(f).toString('base64');
  return `<img src="data:image/jpeg;base64,${b64}" alt="${esc(site.name)} homepage" loading="lazy">`;
}

const domain = u => u.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

let sections = '';
for (const cat of cats) {
  const cards = byCat[cat].map(site => `
      <a class="card" href="${esc(site.url)}" target="_blank" rel="noopener" data-name="${esc(site.name.toLowerCase())}" data-domain="${esc(domain(site.url))}" data-platform="${esc(site.platform)}">
        <div class="shot">${imgTag(site)}${site.recent ? '<span class="new">New</span>' : ''}</div>
        <div class="meta">
          <div class="names">
            <span class="client">${esc(site.name)}</span>
            <span class="domain">${esc(domain(site.url))}</span>
          </div>
          <div class="row2">
            ${site.platform ? `<span class="badge">${esc(site.platform)}</span>` : ''}
            <button class="copy" type="button" data-url="${esc(site.url)}" aria-label="Copy link to ${esc(site.name)}">Copy link</button>
          </div>
        </div>
      </a>`).join('');
  sections += `
    <section class="cat" data-cat="${esc(cat)}">
      <h2><span>${esc(cat)}</span><span class="count">${byCat[cat].length}</span></h2>
      <div class="grid">${cards}</div>
    </section>`;
}

const chips = ['All', ...cats].map((c, i) =>
  `<button class="chip${i === 0 ? ' active' : ''}" data-cat="${esc(c)}" type="button">${esc(c)}</button>`).join('');

const platforms = [...new Set(sites.flatMap(s => (s.platform || '').split(' + ')).filter(Boolean))].sort();
const platChips = ['All platforms', ...platforms].map((p, i) =>
  `<button class="chip plat${i === 0 ? ' active' : ''}" data-plat="${esc(p)}" type="button">${esc(p)}</button>`).join('');

const html = `<title>Sparo Studios Website Portfolio</title>
<style>
  :root{
    --paper:#FBFAF8; --ink:#1A1917; --sub:#6E6A63; --line:#E5E2DC;
    --card:#FFFFFF; --accent:#4A6B57; --accent-ink:#FFFFFF;
    --chipbg:#F0EEE9; --shadow:0 1px 2px rgba(26,25,23,.05),0 6px 20px rgba(26,25,23,.06);
  }
  @media (prefers-color-scheme: dark){
    :root{ --paper:#161513; --ink:#EDEAE4; --sub:#9B968D; --line:#2C2A26;
      --card:#1F1D1A; --accent:#7FA98E; --accent-ink:#14231B;
      --chipbg:#242220; --shadow:0 1px 2px rgba(0,0,0,.4),0 6px 20px rgba(0,0,0,.35); }
  }
  :root[data-theme="light"]{
    --paper:#FBFAF8; --ink:#1A1917; --sub:#6E6A63; --line:#E5E2DC;
    --card:#FFFFFF; --accent:#4A6B57; --accent-ink:#FFFFFF;
    --chipbg:#F0EEE9; --shadow:0 1px 2px rgba(26,25,23,.05),0 6px 20px rgba(26,25,23,.06);
  }
  :root[data-theme="dark"]{
    --paper:#161513; --ink:#EDEAE4; --sub:#9B968D; --line:#2C2A26;
    --card:#1F1D1A; --accent:#7FA98E; --accent-ink:#14231B;
    --chipbg:#242220; --shadow:0 1px 2px rgba(0,0,0,.4),0 6px 20px rgba(0,0,0,.35);
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
  header.top{padding:36px 32px 8px;max-width:1480px;margin:0 auto}
  header.top h1{font-size:26px;font-weight:650;letter-spacing:-.01em;margin:0 0 4px}
  header.top p{margin:0;color:var(--sub);max-width:62ch}
  .toolbar{background:var(--paper);border-bottom:1px solid var(--line);margin-top:20px}
  .toolbar-in{max-width:1480px;margin:0 auto;padding:14px 32px;display:flex;flex-direction:column}
  .trow{display:flex;align-items:flex-start;gap:12px;padding:12px 0}
  .trow + .trow{border-top:1px solid var(--line)}
  .trow-top{align-items:center;padding-top:2px}
  .trow:last-child{padding-bottom:4px}
  .lbl{flex:0 0 68px;font:600 11px/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--sub);padding-top:9px}
  .search{flex:0 1 320px;min-width:200px;position:relative}
  .search input{width:100%;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink);font:inherit}
  .search input:focus{outline:2px solid var(--accent);outline-offset:1px;border-color:transparent}
  .chips{display:flex;gap:6px;flex-wrap:wrap;flex:1}
  .chip{border:1px solid var(--line);background:var(--chipbg);color:var(--ink);padding:6px 12px;border-radius:999px;font:500 13px/1 system-ui,sans-serif;cursor:pointer}
  .chip:hover{border-color:var(--sub)}
  .chip.active{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
  .chip:focus-visible,.copy:focus-visible,.card:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .shown{color:var(--sub);font-variant-numeric:tabular-nums;white-space:nowrap;font-size:13px}
  main{max-width:1480px;margin:0 auto;padding:8px 32px 72px}
  .cat{margin-top:36px}
  .cat h2{display:flex;align-items:baseline;gap:10px;font-size:13px;font-weight:650;letter-spacing:.09em;text-transform:uppercase;color:var(--ink);margin:0 0 14px;padding-bottom:8px;border-bottom:1px solid var(--line)}
  .cat h2 .count{color:var(--sub);font-weight:500;letter-spacing:0;font-variant-numeric:tabular-nums}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
  .card{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;text-decoration:none;color:inherit;box-shadow:var(--shadow);transition:transform .15s ease,box-shadow .15s ease}
  @media (prefers-reduced-motion: reduce){.card{transition:none}}
  .card:hover{transform:translateY(-2px);box-shadow:0 2px 4px rgba(26,25,23,.06),0 12px 32px rgba(26,25,23,.10)}
  .shot{position:relative;aspect-ratio:16/10;background:var(--chipbg);overflow:hidden}
  .shot img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
  .ph{display:flex;align-items:center;justify-content:center;height:100%;color:var(--sub);font-size:13px}
  .new{position:absolute;top:10px;left:10px;background:var(--accent);color:var(--accent-ink);font:600 11px/1 system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;padding:5px 8px;border-radius:6px}
  .meta{display:flex;flex-direction:column;gap:8px;padding:12px 14px 13px}
  .names{display:flex;flex-direction:column;gap:1px;min-width:0}
  .client{font-weight:600;font-size:15px}
  .domain{color:var(--sub);font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .row2{display:flex;align-items:center;justify-content:space-between;gap:8px}
  .badge{font:500 11.5px/1 system-ui,sans-serif;color:var(--sub);border:1px solid var(--line);padding:4px 7px;border-radius:5px}
  .copy{border:none;background:none;color:var(--accent);font:500 12.5px/1 system-ui,sans-serif;cursor:pointer;padding:5px 7px;border-radius:6px;margin-left:auto}
  .copy:hover{background:var(--chipbg)}
  .empty{display:none;color:var(--sub);text-align:center;padding:70px 0}
  footer{max-width:1480px;margin:0 auto;padding:0 32px 48px;color:var(--sub);font-size:12.5px}
</style>
<header class="top">
  <h1>Sparo Studios Website Portfolio</h1>
  <p>Live client websites, organised by industry. Click a card to open the site in a new tab, or copy the link to send to a prospect.</p>
</header>
<div class="toolbar">
  <div class="toolbar-in">
    <div class="trow trow-top">
      <div class="search"><input id="q" type="search" placeholder="Search client or domain" aria-label="Search sites"></div>
      <span class="shown" id="shown" style="margin-left:auto"></span>
    </div>
    <div class="trow">
      <span class="lbl">Industry</span>
      <div class="chips" id="chips">${chips}</div>
    </div>
    <div class="trow">
      <span class="lbl">Platform</span>
      <div class="chips" id="platchips">${platChips}</div>
    </div>
  </div>
</div>
<main>
  ${sections}
  <p class="empty" id="empty">No sites match. Clear the search or pick another category.</p>
</main>
<footer>Sparo Studios internal, for the new business team. Source of truth for launches: Notion Client Projects. Last updated 15 July 2026.</footer>
<script>
  const q = document.getElementById('q');
  const chipsEl = document.getElementById('chips');
  const shown = document.getElementById('shown');
  const empty = document.getElementById('empty');
  const total = document.querySelectorAll('.card').length;
  let activeCat = 'All';
  let activePlat = 'All platforms';

  function apply(){
    const term = q.value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll('section.cat').forEach(sec => {
      const inCat = activeCat === 'All' || sec.dataset.cat === activeCat;
      let secVisible = 0;
      sec.querySelectorAll('.card').forEach(card => {
        const inPlat = activePlat === 'All platforms' || card.dataset.platform.split(' + ').includes(activePlat);
        const hit = inCat && inPlat && (!term || card.dataset.name.includes(term) || card.dataset.domain.includes(term) || card.dataset.platform.toLowerCase().includes(term));
        card.style.display = hit ? '' : 'none';
        if (hit) secVisible++;
      });
      sec.style.display = secVisible ? '' : 'none';
      visible += secVisible;
    });
    shown.textContent = visible + ' of ' + total + ' sites';
    empty.style.display = visible ? 'none' : 'block';
  }

  chipsEl.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    chipsEl.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    b.classList.add('active');
    activeCat = b.dataset.cat;
    apply();
  });
  q.addEventListener('input', apply);

  const platEl = document.getElementById('platchips');
  platEl.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    platEl.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    b.classList.add('active');
    activePlat = b.dataset.plat;
    apply();
  });

  document.querySelectorAll('.copy').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      navigator.clipboard.writeText(btn.dataset.url).then(() => {
        const old = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = old; }, 1400);
      });
    });
  });
  apply();
</script>
`;

fs.writeFileSync(path.join(DIR, 'gallery.html'), html);
console.log('gallery.html written:', (html.length / 1024 / 1024).toFixed(2) + ' MB');
if (missing.length) console.log('missing thumbs:', missing.join(', '));
