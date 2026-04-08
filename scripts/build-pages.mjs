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

  // Build a mobile preview shell under /mobile/ from the current main UI.
  // This keeps the canonical / experience unchanged while enabling PWA install testing.
  const mainIndexPath = path.join(outDir, 'index.html');
  const mobileDir = path.join(outDir, 'mobile');
  const mobileIndexPath = path.join(mobileDir, 'index.html');
  await fs.mkdir(mobileDir, { recursive: true });

  const mainIndexHtml = await fs.readFile(mainIndexPath, 'utf8');
  const mobileHeadInjection = [
    '  <meta name="theme-color" content="#0a1220">',
    '  <meta name="apple-mobile-web-app-capable" content="yes">',
    '  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
    '  <meta name="apple-mobile-web-app-title" content="Adjutant Mobile">',
    '  <link rel="manifest" href="./manifest.webmanifest">',
    '  <link rel="apple-touch-icon" href="./icon.svg">',
  ].join('\n');

  const mobileRegistrationScript = [
    '  <script>',
    '    if (\'serviceWorker\' in navigator) {',
    '      window.addEventListener(\'load\', () => {',
    '        navigator.serviceWorker.register(\'./sw.js\').catch((err) => {',
    '          console.warn(\'Mobile service worker registration failed\', err);',
    '        });',
    '      });',
    '    }',
    '  </script>',
  ].join('\n');

  const mobileIndexHtml = mainIndexHtml
    .replace(
      '<link rel="canonical" href="https://scadjutant.com/">',
      '<link rel="canonical" href="https://scadjutant.com/mobile/">\n' + mobileHeadInjection,
    )
    .replace('  <script type="module" src="app.js"></script>', `  <script type="module" src="../app.js"></script>\n${mobileRegistrationScript}`);

  await fs.writeFile(mobileIndexPath, mobileIndexHtml, 'utf8');
  await fs.writeFile(path.join(outDir, '.nojekyll'), '');
  console.log(`Static hosting artifact written to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});