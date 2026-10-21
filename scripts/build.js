#!/usr/bin/env node
/**
 * Builds the static site into ./dist from the Odoo sources in ./odoo
 *   odoo/index.html  (QWeb template, also pasted into Odoo)  ->  dist/index.html
 *   odoo/style.css   (SCSS-safe CSS)                         ->  dist/style.css
 *   odoo/script.js                                           ->  dist/script.js
 *   assets/*                                                 ->  dist/assets/*
 * No dependencies, just Node.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'odoo');
const DIST = path.join(ROOT, 'dist');

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

function read(file) {
    return fs.readFileSync(path.join(SRC, file), 'utf8');
}

// 1. HTML: take the content of <div id="wrap" class="oe_structure"> out of the QWeb wrapper
const qweb = read('index.html');
const start = qweb.indexOf('<div id="wrap" class="oe_structure">');
const end = qweb.lastIndexOf('</div>', qweb.lastIndexOf('</t>', qweb.lastIndexOf('</t>') - 1));
if (start === -1 || end === -1) {
    throw new Error('Could not find the <div id="wrap"> block in odoo/index.html');
}
let body = qweb.slice(start + '<div id="wrap" class="oe_structure">'.length, end);

// self-closing tags (valid in QWeb/XML) -> real HTML open/close pairs
body = body.replace(/<([a-zA-Z][\w-]*)([^<>]*?)\s*\/>/g, (m, tag, attrs) =>
    VOID.has(tag.toLowerCase()) ? m : `<${tag}${attrs}></${tag}>`);

const title = 'Syamili K | Odoo / Python Developer';
const description = 'Portfolio and resume of Syamili K, an Odoo / Python developer with 4+ years of experience building ERP modules, integrations and reports.';
const favicon = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0b1b3a"/>' +
    '<text x="32" y="42" font-family="Arial" font-weight="800" font-size="28" text-anchor="middle" fill="#38bdf8">SK</text></svg>');

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="#050a18">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<link rel="icon" href="${favicon}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
<link rel="stylesheet" href="style.css">
<style>html,body{margin:0;background:#050a18}</style>
</head>
<body>
<div id="wrapwrap">${body}
</div>
<script src="script.js" defer></script>
</body>
</html>
`;

// 2. CSS: the source is SCSS-safe plain CSS; drop the // line comments for the browser
const css = read('style.css')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');

// 3. JS: copied as is
const js = read('script.js');

// 4. write dist
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), page);
fs.writeFileSync(path.join(DIST, 'style.css'), css);
fs.writeFileSync(path.join(DIST, 'script.js'), js);
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

const assets = path.join(ROOT, 'assets');
if (fs.existsSync(assets)) {
    for (const f of fs.readdirSync(assets)) {
        fs.copyFileSync(path.join(assets, f), path.join(DIST, 'assets', f));
    }
}

const kb = (f) => (fs.statSync(path.join(DIST, f)).size / 1024).toFixed(1) + ' KB';
console.log('Built dist/ ->', `index.html ${kb('index.html')}, style.css ${kb('style.css')}, script.js ${kb('script.js')}`);
