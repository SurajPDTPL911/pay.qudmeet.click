// ES Module version of the server
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io with our server
  try {
    // Import the socket module
    const { initSocketServer } = await import('./lib/socket.js');
    initSocketServer(server);
    console.log('Socket.io server initialized');
  } catch (err) {
    console.error('Failed to initialize Socket.io server:', err);
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
