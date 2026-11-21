// Node 22 delivery entrypoint. The app itself is static and has no build step.
// Paths are relative to this file so the sandbox can invoke it from any cwd.
import { cpSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repository = fileURLToPath(new URL('.', import.meta.url));
const destination = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
const screenshots = readdirSync(join(repository, 'screenshots'), { withFileTypes:true })
  .filter(entry => !entry.name.startsWith('.'));
if (screenshots.length < 3 || screenshots.length > 4 ||
    screenshots.some(entry => !entry.isFile() || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpe?g)$/i.test(entry.name))) {
  throw new Error('screenshots/ must contain exactly three or four PNG/JPEG files.');
}

mkdirSync(destination, { recursive:true });
for (const directory of ['app', 'screenshots']) {
  cpSync(join(repository,directory), join(destination,directory), { recursive:true });
}
const dossier = buildDossier(destination, {
  text_max_bytes: 163840,
  screenshots: { max:4, max_bytes:262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(destination,'dossier.json'), dossier);
console.log(`After Hours: static app, ${screenshots.length} screenshots, deterministic dossier.`);
