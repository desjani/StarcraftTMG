import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'dist', 'pages');
const publicDir = path.join(rootDir, 'web', 'public');
const libDir = path.join(rootDir, 'lib');

async function ensureCleanDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  await ensureCleanDir(outDir);
  await fs.cp(publicDir, outDir, { recursive: true });
  await fs.cp(libDir, path.join(outDir, 'lib'), { recursive: true });
  await fs.writeFile(path.join(outDir, '.nojekyll'), '');
  console.log(`Static hosting artifact written to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});