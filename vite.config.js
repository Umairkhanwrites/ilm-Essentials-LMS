import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { generateBunnyTokenEmbed, extractBunnyVideoIdentifiers } from './server/bunnyTokenService.js'

function lmsApiPlugin() {
  return {
    name: 'lms-api-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const parsedUrl = new URL(req.url, 'http://localhost');

        if (parsedUrl.pathname === '/api/server-time' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(
            JSON.stringify({
              serverTimeUtc: Date.now(),
              serverIso: new Date().toISOString(),
            })
          );
          return;
        }

        if (parsedUrl.pathname === '/api/video-token' && (req.method === 'POST' || req.method === 'OPTIONS')) {
          if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.statusCode = 204;
            res.end();
            return;
          }

          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              const { videoId: rawVideoId, videoUrl, libraryId: rawLibId, ttlSeconds } = payload;

              let { videoId, libraryId } = extractBunnyVideoIdentifiers(videoUrl || rawVideoId);
              if (rawLibId) libraryId = rawLibId;
              if (rawVideoId && !videoId) videoId = rawVideoId;

              // Enforce strictly 30-45s TTL window
              const ttl = Math.min(Math.max(Number(ttlSeconds) || 45, 30), 45);

              const tokenData = generateBunnyTokenEmbed({
                videoId: videoId || '85a1a1db-04f7-4148-b4b1-8b9a13a968bb',
                libraryId: libraryId || '800731',
                ttlSeconds: ttl,
              });

              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(
                JSON.stringify({
                  success: true,
                  ...tokenData,
                })
              );
            } catch (err) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(
                JSON.stringify({
                  success: false,
                  error: err.message,
                })
              );
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    lmsApiPlugin(),
  ],
})
