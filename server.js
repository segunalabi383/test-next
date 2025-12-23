const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initializeSocket } = require('./lib/socketServer');
const { initializeStorage } = require('./lib/gameStore');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(async () => {
    try {
      console.log('Initializing game storage...');
      // Initialize game storage
      await initializeStorage();
      console.log('Game storage initialized');
      
      const httpServer = createServer((req, res) => {
        try {
          const parsedUrl = parse(req.url, true);
          handle(req, res, parsedUrl).catch((err) => {
            console.error('Error occurred handling', req.url, err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end('internal server error');
            }
          });
        } catch (err) {
          console.error('Error occurred handling', req.url, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.end('internal server error');
          }
        }
      });

      // Initialize Socket.io
      console.log('Initializing Socket.io...');
      initializeSocket(httpServer);
      console.log('Socket.io initialized');

      httpServer.listen(port, (err) => {
        if (err) {
          console.error('Failed to start server:', err);
          process.exit(1);
        }
        console.log(`> Ready on http://${hostname}:${port}`);
      });
    } catch (error) {
      console.error('Failed to initialize server:', error);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Failed to prepare Next.js app:', err);
    process.exit(1);
  });

