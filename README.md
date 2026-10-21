# Syamili K - Portfolio (modules edition)

Portfolio and resume of **Syamili K**, Odoo / Python Developer. Dark bento-grid theme with a light-mode toggle,
a one-click **Download CV** button, and an Experience section organised by Odoo modules and the areas worked on (no project names) and a print-friendly layout. Plain Node.js, no dependencies.

## Project layout

```
odoo/                 Source of truth. These 3 files are also what gets pasted into Odoo Online
  index.html            QWeb template for the Home view
  style.css             SCSS-safe CSS  (Site > HTML/CSS Editor > SCSS)
  script.js             JavaScript     (Site > HTML/CSS Editor > JS)
assets/
  Syamili_K_Resume.pdf  The downloadable resume
scripts/
  build.js              odoo/*  ->  dist/  (static site)
  serve.js              local static server for dist/
  embed-cv.js           embeds the PDF into the Download CV button
tools/
  make_cv.py            builds the resume PDF from the text in odoo/index.html (needs: pip3 install reportlab)
.github/workflows/
  pages.yml             builds and deploys to GitHub Pages on every push to main
```

## Run locally

```bash
npm run dev        # build + serve at http://localhost:3000
npm run build      # only build into dist/
npm start          # only serve an existing dist/
```

Requires Node 18 or newer. There is nothing to `npm install`.

## Update the resume

1. Edit the text in `odoo/index.html`.
2. `pip3 install reportlab` (once), then `npm run cv` - regenerates `assets/Syamili_K_Resume.pdf` from the page text
   and embeds it in the Download CV button.
3. `git add -A && git commit -m "Update resume" && git push`

## Deploy with GitHub Pages

1. Create an empty repository on GitHub and push this project to the `main` branch.
2. In the repository open **Settings > Pages** and set **Source** to **GitHub Actions**.
3. Every push to `main` runs the workflow and publishes the site at
   `https://<your-username>.github.io/<repository-name>/`.

## Use it in Odoo Online

Paste the files from `odoo/` into your website: `index.html` into the Home view, `style.css` into the SCSS tab and
`script.js` into the JS tab. Replace all three together, then hard-refresh.
