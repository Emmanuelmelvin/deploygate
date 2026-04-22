import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

const servers = new Map<number, http.Server>();

const mimeTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

export async function startServer(
  port: number,
  distPath: string
): Promise<http.Server> {
  // Stop existing server on this port
  const existing = servers.get(port);
  if (existing) {
    await stopServer(existing);
  }

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url) {
        res.writeHead(400);
        res.end('Bad Request');
        return;
      }

      let filePath = path.join(distPath, req.url);

      // If it's a directory or doesn't exist, try index.html
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distPath, 'index.html');
      }

      // If index.html itself is missing, return 404
      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not Found');
        logger.indent(`${req.method} ${req.url} → 404`);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
        logger.indent(`${req.method} ${req.url} → 200`);
      } catch (error) {
        res.writeHead(500);
        res.end('Internal Server Error');
        logger.indent(`${req.method} ${req.url} → 500`);
      }
    });

    server.listen(port, () => {
      servers.set(port, server);
      logger.success(`Server running on http://localhost:${port}`);
      resolve(server);
    });

    server.on('error', reject);
  });
}

export async function stopServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => {
      // Remove from map
      for (const [port, srv] of servers) {
        if (srv === server) {
          servers.delete(port);
          break;
        }
      }
      resolve();
    });
  });
}
