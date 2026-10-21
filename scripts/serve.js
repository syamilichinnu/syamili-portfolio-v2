#!/usr/bin/env node
/** Tiny static file server for ./dist (no dependencies). Usage: npm start  ->  http://localhost:3000 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = process.env.PORT || 3000;

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.pdf': 'application/pdf',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
};

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('dist/ not found. Run "npm run build" first (or use "npm run dev").');
    process.exit(1);
}

http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = path.normalize(path.join(DIST, urlPath));
    if (!file.startsWith(DIST)) {           // block path traversal
        res.writeHead(403).end('Forbidden');
        return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        file = path.join(file, 'index.html');
    }
    fs.readFile(file, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
    });
}).listen(PORT, () => console.log(`Portfolio running at http://localhost:${PORT}`));
