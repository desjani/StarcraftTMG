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

  const mobileInstallUiScript = [
    '  <style>',
    '    .mobile-install-banner {',
    '      position: fixed;',
    '      top: 0;',
    '      left: 0;',
    '      right: 0;',
    '      z-index: 9999;',
    '      display: none;',
    '      align-items: center;',
    '      justify-content: space-between;',
    '      gap: 10px;',
    '      padding: 10px 12px;',
    '      border-bottom: 1px solid rgba(102, 182, 255, .55);',
    '      background: linear-gradient(180deg, rgba(7, 16, 31, .98), rgba(10, 20, 36, .96));',
    '      box-shadow: 0 10px 24px rgba(0, 0, 0, .42);',
    '      color: #d4deed;',
    '      font-family: Rajdhani, Segoe UI, sans-serif;',
    '      font-size: .92rem;',
    '      line-height: 1.2;',
    '    }',
    '    .mobile-install-banner__text {',
    '      margin: 0;',
    '      display: flex;',
    '      flex-direction: column;',
    '      gap: 2px;',
    '      min-width: 0;',
    '    }',
    '    .mobile-install-banner__title {',
    '      font-family: Orbitron, Segoe UI, sans-serif;',
    '      font-size: .66rem;',
    '      letter-spacing: .08em;',
    '      text-transform: uppercase;',
    '      color: #66b6ff;',
    '    }',
    '    .mobile-install-banner__hint {',
    '      color: #d4deed;',
    '      font-size: .9rem;',
    '      white-space: nowrap;',
    '      overflow: hidden;',
    '      text-overflow: ellipsis;',
    '    }',
    '    .mobile-install-banner__actions {',
    '      display: inline-flex;',
    '      align-items: center;',
    '      gap: 8px;',
    '      flex-shrink: 0;',
    '    }',
    '    .mobile-install-banner button {',
    '      border: 1px solid transparent;',
    '      border-radius: 999px;',
    '      padding: 8px 12px;',
    '      font-family: Orbitron, Segoe UI, sans-serif;',
    '      font-size: .68rem;',
    '      letter-spacing: .06em;',
    '      text-transform: uppercase;',
    '      font-weight: 700;',
    '      cursor: pointer;',
    '      color: #061220;',
    '      background: linear-gradient(180deg, #79c4ff, #53a8f2);',
    '      white-space: nowrap;',
    '    }',
    '    .mobile-install-menu-btn {',
    '      border-color: rgba(49, 69, 99, .8) !important;',
    '      background: rgba(17, 27, 44, .9) !important;',
    '      color: #d4deed !important;',
    '    }',
    '    .mobile-install-close {',
    '      border: 1px solid rgba(49, 69, 99, .8) !important;',
    '      background: rgba(17, 27, 44, .9) !important;',
    '      color: #d4deed !important;',
    '      width: 28px;',
    '      height: 28px;',
    '      padding: 0 !important;',
    '      display: inline-flex;',
    '      align-items: center;',
    '      justify-content: center;',
    '      font-size: .82rem !important;',
    '      line-height: 1;',
    '    }',
    '    body.mobile-install-banner-open {',
    '      padding-top: 54px;',
    '    }',
    '    @media (max-width: 760px) {',
    '      .mobile-install-banner {',
    '        padding: 10px 9px;',
    '        gap: 8px;',
    '      }',
    '      .mobile-install-banner__hint {',
    '        white-space: normal;',
    '      }',
    '      .mobile-install-banner__actions {',
    '        gap: 6px;',
    '      }',
    '      .mobile-install-banner button {',
    '        padding: 7px 10px;',
    '        font-size: .63rem;',
    '      }',
    '      body.mobile-install-banner-open {',
    '        padding-top: 66px;',
    '      }',
    '    }',
    '  </style>',
    '  <script>',
    '    (function initMobileInstallHelper() {',
    '      const isStandalone = window.matchMedia(\'(display-mode: standalone)\').matches || window.navigator.standalone === true;',
    '      if (isStandalone) return;',
    '',
    '      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);',
    '      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);',
    '      let installPromptEvent = null;',
    '      let dismissed = false;',
    '',
    '      const shell = document.createElement(\'div\');',
    '      shell.className = \'mobile-install-banner\';',
    '      shell.innerHTML = [',
    '        \'<div class="mobile-install-banner__text">\',',
    '        \'  <span class="mobile-install-banner__title">Adjutant Mobile Preview</span>\',',
    '        \'  <span id="mobile-install-hint" class="mobile-install-banner__hint"></span>\',',
    '        \'</div>\',',
    '        \'<div class="mobile-install-banner__actions">\',',
    '        \'  <button type="button" id="mobile-install-btn" aria-label="Install app">Install app</button>\',',
    '        \'  <button type="button" class="mobile-install-menu-btn" id="mobile-install-menu-btn" aria-label="Show manual install steps">Menu</button>\',',
    '        \'  <button type="button" class="mobile-install-close" id="mobile-install-close" aria-label="Dismiss install help">X</button>\',',
    '        \'</div>\'',
    '      ].join(\'\');',
    '      document.body.appendChild(shell);',
    '',
    '      const installBtn = shell.querySelector(\'#mobile-install-btn\');',
    '      const menuBtn = shell.querySelector(\'#mobile-install-menu-btn\');',
    '      const hintEl = shell.querySelector(\'#mobile-install-hint\');',
    '      const closeBtn = shell.querySelector(\'#mobile-install-close\');',
    '',
    '      function show(message, canInstall) {',
    '        if (dismissed) return;',
    '        hintEl.textContent = message;',
    '        installBtn.style.display = canInstall ? \'inline-flex\' : \'none\';',
    '        menuBtn.style.display = isIOS ? \'none\' : \'inline-flex\';',
    '        shell.style.display = \'inline-flex\';',
    '        document.body.classList.add(\'mobile-install-banner-open\');',
    '      }',
    '',
    '      function hide() {',
    '        shell.style.display = \'none\';',
    '        document.body.classList.remove(\'mobile-install-banner-open\');',
    '      }',
    '',
    '      closeBtn.addEventListener(\'click\', () => {',
    '        dismissed = true;',
    '        hide();',
    '      });',
    '',
    '      menuBtn.addEventListener(\'click\', () => {',
    '        show(\'If Install is missing: Chrome menu (⋮) > Install app.\', !!installPromptEvent);',
    '      });',
    '',
    '      installBtn.addEventListener(\'click\', async () => {',
    '        if (!installPromptEvent) return;',
    '        installPromptEvent.prompt();',
    '        const result = await installPromptEvent.userChoice;',
    '        if (result && result.outcome === \'accepted\') {',
    '          hide();',
    '        }',
    '        installPromptEvent = null;',
    '      });',
    '',
    '      window.addEventListener(\'beforeinstallprompt\', (event) => {',
    '        event.preventDefault();',
    '        installPromptEvent = event;',
    '        show(\'Install Adjutant Mobile on your home screen.\', true);',
    '      });',
    '',
    '      if (isIOS && isSafari) {',
    '        show(\'In Safari: Share > Add to Home Screen.\', false);',
    '      } else {',
    '        show(\'Tip: use Chrome menu (⋮) > Install app if no prompt appears.\', false);',
    '      }',
    '    }());',
    '  </script>',
  ].join('\n');

  const mobileIndexHtml = mainIndexHtml
    .replace(
      '<link rel="canonical" href="https://scadjutant.com/">',
      '<link rel="canonical" href="https://scadjutant.com/mobile/">\n' + mobileHeadInjection,
    )
    .replace('  <script type="module" src="app.js"></script>', `  <script type="module" src="../app.js"></script>\n${mobileRegistrationScript}`)
    .replace('</body>', `${mobileInstallUiScript}\n</body>`);

  await fs.writeFile(mobileIndexPath, mobileIndexHtml, 'utf8');
  await fs.writeFile(path.join(outDir, '.nojekyll'), '');
  console.log(`Static hosting artifact written to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});