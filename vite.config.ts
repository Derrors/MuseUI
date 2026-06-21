import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { IncomingMessage } from 'node:http';

const API_PROXY_PREFIX = '/api-proxy';

const isSameOriginDevRequest = (req: IncomingMessage): boolean => {
  const { headers } = req;
  const host = headers.host;
  if (!host || Array.isArray(host)) return false;

  const allowedOrigins = new Set([`http://${host}`, `https://${host}`]);
  const origin = Array.isArray(headers.origin) ? headers.origin[0] : headers.origin;
  if (origin) return allowedOrigins.has(origin);

  const referer = Array.isArray(headers.referer) ? headers.referer[0] : headers.referer;
  if (!referer) return false;

  try {
    return allowedOrigins.has(new URL(referer).origin);
  } catch {
    return false;
  }
};

const apiProxyPlugin = (): Plugin => ({
  name: 'muse-ui-api-proxy',
  configureServer(server) {
    server.middlewares.use(API_PROXY_PREFIX, async (req, res) => {
      try {
        if (!isSameOriginDevRequest(req)) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API proxy is only available to the dev server origin' }));
          return;
        }

        const requestUrl = new URL(req.url || '/', 'http://localhost');
        const target = requestUrl.searchParams.get('target');

        if (!target) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing target URL' }));
          return;
        }

        const targetUrl = new URL(target);
        if (!['http:', 'https:'].includes(targetUrl.protocol)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Unsupported target protocol' }));
          return;
        }

        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) {
          const lower = key.toLowerCase();
          if (['host', 'connection', 'content-length', 'origin', 'referer', 'accept-encoding'].includes(lower)) continue;
          if (Array.isArray(value)) headers.set(key, value.join(', '));
          else if (value !== undefined) headers.set(key, value);
        }

        const method = req.method || 'GET';
        let body: Buffer | undefined;
        if (method !== 'GET' && method !== 'HEAD') {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(Buffer.from(chunk));
          body = Buffer.concat(chunks);
        }

        const upstream = await fetch(targetUrl, { method, headers, body, redirect: 'manual' });
        res.statusCode = upstream.status;
        upstream.headers.forEach((value, key) => {
          if (['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) return;
          res.setHeader(key, value);
        });
        res.end(Buffer.from(await upstream.arrayBuffer()));
      } catch (error) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
      }
    });
  },
});

export default defineConfig({
  plugins: [react(), apiProxyPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3003,
  },
  build: {
    chunkSizeWarningLimit: 1300,
  },
});
