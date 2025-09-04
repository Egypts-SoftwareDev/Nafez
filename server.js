/*
 * Minimal HTTP server for the Nafez landing page.
 *
 * This server uses built‑in Node.js modules (http, fs, path, url) to avoid
 * external dependencies. It serves static files from the `public`
 * directory and exposes a POST endpoint at `/subscribe` to record
 * subscribers' emails and names in a JSON file. In a production
 * environment you should store subscriber data in a secure database
 * rather than a local JSON file.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Minimal .env loader (no external deps). Loads only if file exists and
// does not override variables that are already set in the environment.
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  }
} catch (_) {
  // ignore .env parsing errors in production
}

// Server configuration
const PORT = process.env.PORT || 3000;
const staticDir = path.join(__dirname, 'public');
const dataDir = path.join(__dirname, 'data');
// Resolve and sanitize alpha origin (scheme + host[:port]). Falls back to localhost:4000
const alphaOrigin = (() => {
  const fallback = 'http://localhost:4000';
  let raw = (process.env.ALPHA_ORIGIN || '').trim();
  if (!raw) return fallback;
  // Prepend https:// if scheme missing
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw)) {
    raw = 'https://' + raw;
  }
  try {
    const u = new url.URL(raw);
    return u.origin; // ensure we keep only the origin without any path
  } catch (e) {
    console.error('Invalid ALPHA_ORIGIN, using default:', raw, e.message);
    return fallback;
  }
})();

// Base path where the alpha app is mounted on the alpha origin.
// Example values:
//  - '/alpha' (default; matches local alpha server)
//  - '/' or '' (production alpha mounted at root)
const alphaBasePath = (() => {
  let raw = (process.env.ALPHA_BASE_PATH || '/alpha').trim();
  if (!raw) return '';
  // Normalize: ensure leading slash; remove trailing slashes
  if (!raw.startsWith('/')) raw = '/' + raw;
  raw = raw.replace(/\/+$/, '');
  if (raw === '/') return '';
  return raw;
})();
const subscribersFile = path.join(dataDir, 'subscribers.json');

// Ensure the data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure the subscribers file exists
if (!fs.existsSync(subscribersFile)) {
  fs.writeFileSync(subscribersFile, JSON.stringify([]));
}

/**
 * Determine the content type based on file extension.
 * @param {string} ext
 * @returns {string}
 */
function getContentType(ext) {
  switch (ext.toLowerCase()) {
    case '.html':
      return 'text/html';
    case '.css':
      return 'text/css';
    case '.js':
      return 'application/javascript';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.woff2':
      return 'font/woff2';
    case '.woff':
      return 'font/woff';
    case '.ttf':
      return 'font/ttf';
    case '.otf':
      return 'font/otf';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Read subscribers from JSON file.
 * @returns {Array<{email: string, name: string, date: string}>}
 */
function readSubscribers() {
  try {
    const raw = fs.readFileSync(subscribersFile, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading subscribers file:', err);
    return [];
  }
}

/**
 * Write subscribers to JSON file.
 * @param {Array} list
 */
function writeSubscribers(list) {
  try {
    fs.writeFileSync(subscribersFile, JSON.stringify(list, null, 2));
  } catch (err) {
    console.error('Error writing subscribers file:', err);
  }
}

/**
 * Handle subscription POST request. Collects the request body, parses
 * JSON, validates the email, checks for duplicates, and appends to
 * subscribers file. Responds with appropriate HTTP status codes.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function handleSubscribe(req, res) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
    // Protect against large payloads (over ~1 MB)
    if (body.length > 1e6) {
      req.connection.destroy();
    }
  });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const email = (data.email || '').toString().trim();
      const name = (data.name || '').toString().trim();
      if (!email || !email.includes('@')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Valid email is required.' }));
        return;
      }
      const subscribers = readSubscribers();
      const exists = subscribers.some(
        (sub) => sub.email.toLowerCase() === email.toLowerCase()
      );
      if (exists) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({ error: 'This email is already subscribed.' })
        );
        return;
      }
      subscribers.push({ email, name, date: new Date().toISOString() });
      writeSubscribers(subscribers);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Subscription successful.' }));
    } catch (err) {
      console.error('Error handling subscription:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error.' }));
    }
  });
}

/**
 * Serve static files from the public directory. If file does not
 * exist, respond with 404.
 * @param {string} filePath
 * @param {http.ServerResponse} res
 */
function serveStatic(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    } else {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': getContentType(ext) });
      res.end(data);
    }
  });
}

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (req.method === 'POST' && parsedUrl.pathname === '/subscribe') {
    handleSubscribe(req, res);
    return;
  }
  // Redirect any /alpha/* request to the real alpha server
  if ((req.method === 'GET' || req.method === 'HEAD') &&
      (parsedUrl.pathname === '/alpha' || parsedUrl.pathname.startsWith('/alpha/'))) {
    // Compute remainder after '/alpha'
    let remainder = parsedUrl.pathname === '/alpha' ? '/' : parsedUrl.pathname.slice('/alpha'.length);
    if (!remainder.startsWith('/')) remainder = '/' + remainder;
    // If user requested just /alpha or /alpha/, send them to the alpha login page
    const normalizedRemainder = (remainder === '/' ? '/login' : remainder);
    const targetPath = `${alphaBasePath}${normalizedRemainder}`;
    const target = `${alphaOrigin}${targetPath}${parsedUrl.search || ''}`;
    res.writeHead(302, { Location: target });
    res.end();
    return;
  }
  // Normalize path and avoid directory traversal
  let pathname = decodeURIComponent(parsedUrl.pathname);
  if (pathname === '/') pathname = '/index.html';
  let filePath = path.join(staticDir, pathname);
  // Prevent access outside of staticDir
  if (!filePath.startsWith(staticDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }
  try {
    const stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
    if (stat && stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch (_) {
    // Fall through; serveStatic will handle missing paths
  }
  serveStatic(filePath, res);
});

// Start listening
server.listen(PORT, () => {
  console.log(`Nafez landing page server running on port ${PORT}`);
});
