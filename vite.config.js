import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
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

        if (parsedUrl.pathname === '/api/admin/provision-student' && (req.method === 'POST' || req.method === 'OPTIONS')) {
          if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.statusCode = 204;
            res.end();
            return;
          }

          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            try {
              let envVars = {};
              try {
                const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
                envVars = Object.fromEntries(
                  envFile.split('\n').filter(l => l.trim() && !l.startsWith('#') && l.includes('=')).map(l => {
                    const idx = l.indexOf('=');
                    return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
                  })
                );
              } catch (e) {}

              const sbUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
              const sbKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

              if (!sbUrl || !sbKey) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: 'Supabase service credentials not configured.' }));
                return;
              }

              const sbAdmin = createClient(sbUrl, sbKey, { auth: { autoRefreshToken: false, persistSession: false } });

              const payload = JSON.parse(body || '{}');
              const { email, password, name, phone, format, cohort_id } = payload;
              if (!email) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: 'Email is required.' }));
                return;
              }

              const cleanEmail = email.trim().toLowerCase();

              // 1. Check if user already exists in Supabase Auth
              const listRes = await sbAdmin.auth.admin.listUsers();
              let authUser = listRes.data?.users?.find(u => u.email.toLowerCase() === cleanEmail);

              if (!authUser) {
                const { data: newUser, error: createErr } = await sbAdmin.auth.admin.createUser({
                  email: cleanEmail,
                  password: password || 'student123',
                  email_confirm: true,
                  user_metadata: { name: name || 'Student' },
                  app_metadata: { role: 'student' },
                });
                if (createErr) throw createErr;
                authUser = newUser.user;
              }

              // 2. Insert or update row in public.students with the auth.users id
              const { data: studentRecord, error: stdErr } = await sbAdmin
                .from('students')
                .upsert({
                  id: authUser.id,
                  email: cleanEmail,
                  name: name || 'Student',
                  phone: phone || '+92 300 0000000',
                  role: 'student',
                  cohort_id: cohort_id || 'foundations_sem1',
                  format: format === 'onsite' ? 'onsite' : 'online',
                  is_video_restricted: false,
                }, { onConflict: 'id' })
                .select()
                .single();

              if (stdErr) throw stdErr;

              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, student: studentRecord }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: err.message }));
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
