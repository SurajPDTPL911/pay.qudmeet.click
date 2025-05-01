// This file needs to be JavaScript since it's the entry point
// We use dynamic imports to load TypeScript modules
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io with our server
  // We need to dynamically import the TypeScript module
  import('./lib/socket.js').then(({ initSocketServer }) => {
    initSocketServer(server);
    console.log('Socket.io server initialized');
  }).catch(err => {
    console.error('Failed to initialize Socket.io server:', err);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
