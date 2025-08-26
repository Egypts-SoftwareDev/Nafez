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

// Server configuration
const PORT = process.env.PORT || 3000;
const staticDir = path.join(__dirname, 'public');
const subscribersFile = path.join(__dirname, 'subscribers.json');

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
  // Normalize path and avoid directory traversal
  let pathname = decodeURIComponent(parsedUrl.pathname);
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(staticDir, pathname);
  // Prevent access outside of staticDir
  if (!filePath.startsWith(staticDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }
  serveStatic(filePath, res);
});

// Start listening
server.listen(PORT, () => {
  console.log(`Nafez landing page server running on port ${PORT}`);
});