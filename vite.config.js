import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { promises as fs } from 'node:fs';
import path from 'node:path';

// Dev-only middleware: writes a reel package to disk under the project root.
// POST /__write-reel  { dir: "05_outputs/reels/...", files: { name: content } }
function writeReelPlugin() {
  return {
    name: 'write-reel',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__write-reel', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        let raw = '';
        req.on('data', (chunk) => { raw += chunk; });
        req.on('end', async () => {
          try {
            const { dir, files } = JSON.parse(raw || '{}');
            const root = server.config.root;
            const outputsRoot = path.resolve(root, '05_outputs');
            const targetDir = path.resolve(root, dir);
            // Path-safety: targetDir must be 05_outputs or a descendant of it.
            if (targetDir !== outputsRoot && !targetDir.startsWith(outputsRoot + path.sep)) {
              res.statusCode = 400;
              res.end('Invalid target dir');
              return;
            }
            await fs.mkdir(targetDir, { recursive: true });
            for (const [name, content] of Object.entries(files || {})) {
              const filePath = path.resolve(targetDir, name);
              // Path-safety: each file must stay inside targetDir (no ../ escapes).
              if (!filePath.startsWith(targetDir + path.sep)) {
                res.statusCode = 400;
                res.end('Invalid file name');
                return;
              }
              await fs.writeFile(filePath, content, 'utf8');
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, dir }));
          } catch (err) {
            res.statusCode = 500;
            res.end(String(err));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), writeReelPlugin()],
});
