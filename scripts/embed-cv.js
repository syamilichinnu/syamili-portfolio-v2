#!/usr/bin/env node
/**
 * Re-embeds assets/Syamili_K_Resume.pdf into the Download CV button of odoo/index.html
 * (the button saves the embedded PDF directly, so no file hosting is needed).
 * Run after regenerating the PDF:  npm run cv
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const pdf = fs.readFileSync(path.join(ROOT, 'assets', 'Syamili_K_Resume.pdf'));
const file = path.join(ROOT, 'odoo', 'index.html');
const html = fs.readFileSync(file, 'utf8');

if (!/data-cv="[^"]*"/.test(html)) {
    throw new Error('No data-cv attribute found on the Download CV button in odoo/index.html');
}
fs.writeFileSync(file, html.replace(/data-cv="[^"]*"/, () => `data-cv="${pdf.toString('base64')}"`));
console.log(`Embedded Syamili_K_Resume.pdf (${(pdf.length / 1024).toFixed(1)} KB) into odoo/index.html`);
