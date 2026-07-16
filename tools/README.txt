Rebuild steps:
1. Edit tools/sites.json (add/remove sites, set "recent": true for the New badge).
2. cd tools && npm install playwright-core && node shoot.js (screenshots new sites into shots/).
3. sips -Z 440 -s format jpeg -s formatOptions 55 shots/<name>.png --out thumbs/<name>.jpg
4. node build.js (writes gallery.html), wrap in doctype/head as index.html at repo root.
5. git commit and push. GitHub Pages deploys automatically.
