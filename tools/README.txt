Sparo website portfolio: how to update

Live page: https://directorsparo.github.io/sparo-website-portfolio/

Files
- sites.json   one entry per site: cat (industry), name, url, platform, and "recent": true for the New badge
- shoot.js     captures each homepage (1440 wide, two screens deep) into tools/shots/ (not committed)
- build.js     resizes captures into /images and writes /index.html at the repo root

Adding or changing sites
1. Edit tools/sites.json. A new industry also needs adding to CAT_ORDER at the top of build.js.
2. cd tools && npm install          (first time only)
3. node shoot.js                    captures any site that has no screenshot yet
   node shoot.js "Site Name"        recaptures one site, e.g. if a popup covered the hero
4. node build.js
5. git add -A && git commit -m "..." && git push    GitHub Pages redeploys in a minute or two
