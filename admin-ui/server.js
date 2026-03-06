const path = require('path')
const http = require('http')
const fs = require('fs')

const PORT = process.env.PORT || 3000
const DIST = path.join(__dirname, 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
}

const server = http.createServer((req, res) => {
  // Strip query string
  const urlPath = req.url.split('?')[0]

  // Candidate file path
  let filePath = path.join(DIST, urlPath)

  // Prevent directory traversal
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  // Try the exact path, then path + .html, then fall back to index.html (SPA)
  const candidates = [
    filePath,
    filePath.endsWith('/') ? path.join(filePath, 'index.html') : null,
    path.join(DIST, 'index.html'),
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const ext = path.extname(candidate)
      const contentType = MIME[ext] || 'application/octet-stream'
      res.writeHead(200, { 'Content-Type': contentType })
      fs.createReadStream(candidate).pipe(res)
      return
    }
  }

  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`CAP Upgrade Admin UI listening on port ${PORT}`)
})
