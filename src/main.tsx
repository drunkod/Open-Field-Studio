// Tauri + Open Field Studio
// Initialize i18next, then start the app immediately, load plugins in background

import i18next from './i18n';
import { mountPtoWorkspace } from './pto/ui.mjs';

// Typed bridge to the legacy browser application in public/app.js.
// Keeping this boundary explicit avoids spreading untyped globals into new modules.
type OFSApp = {
  lang: string;
  _ready: Promise<void>;
  setLanguage: (lang: string) => void;
  switchTab: (tab: string) => void;
  openConnectorConfig?: (id: string) => void;
};
type OFSWindow = Window & {
  i18next?: typeof i18next;
  OpenFieldStudio?: new () => OFSApp;
  app?: OFSApp;
  _setActiveLang?: (lang: string) => void;
  __ofsLoadIfcViewer?: () => Promise<unknown>;
  __tauriDialog?: unknown;
  __tauriFs?: unknown;
  __tauriHttpFetch?: unknown;
};
const ofsWindow = window as OFSWindow;

// __APP_VERSION__ is injected by Vite at build time from package.json.
declare const __APP_VERSION__: string;

// Expose i18next globally
ofsWindow.i18next = i18next;

// Keep the title-bar version label in sync with package.json.
(function syncVersionLabel() {
  const set = () => {
    const el = document.querySelector('.title-bar-version');
    if (el) el.textContent = 'v' + __APP_VERSION__;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', set);
  else set();
})();

// Lazy-load the IFC viewer only when the user opens the BIM tab (heavy — three.js + web-ifc WASM).
ofsWindow.__ofsLoadIfcViewer = () => import('./ifc-viewer.ts');

// Check GitHub Releases for a newer version and render a titlebar badge.
// Silent-fails on offline/rate-limit so it never breaks the app.
import { checkForUpdates, renderUpdateBadge } from './updater';
function runUpdateCheck() {
  const tGet = (key: string, ...args: string[]) => {
    if (!ofsWindow.i18next) return key;
    let s = i18next.t(key, { defaultValue: key });
    args.forEach((a, i) => { s = s.replace(`{${i}}`, a); });
    return s;
  };
  checkForUpdates().then(status => renderUpdateBadge(status, tGet)).catch(() => {});
}

// Expose Tauri plugin APIs globally for app.js (non-blocking)
function exposeTauriPlugins() {
  import('@tauri-apps/plugin-dialog').then(dialog => {
    ofsWindow.__tauriDialog = { save: dialog.save, open: dialog.open, ask: dialog.ask };
  }).catch(() => {});
  import('@tauri-apps/plugin-fs').then(fs => {
    ofsWindow.__tauriFs = { writeTextFile: fs.writeTextFile, readTextFile: fs.readTextFile };
  }).catch(() => {});
  // Backend-routed fetch: bypasses webview CORS for connector APIs (ERPNext, AFAS, ...).
  // Guard on the Tauri runtime, not on the module import — the JS module loads fine in a
  // plain browser but its fetch() throws on the missing IPC bridge ("reading 'invoke'").
  if ('__TAURI_INTERNALS__' in window) {
    import('@tauri-apps/plugin-http').then(http => {
      ofsWindow.__tauriHttpFetch = http.fetch;
    }).catch(() => {});
  }
}

// Initialize the app
function initApp() {
  const OFS = ofsWindow.OpenFieldStudio;
  if (!OFS) return;

  // Create app instance immediately (so onclick="app.xxx" works)
  const app = new OFS();
  ofsWindow.app = app;
  app._ready.then(() => mountPtoWorkspace(app)).catch(console.error);

  // Load Tauri plugins in background (non-blocking)
  exposeTauriPlugins();

  // Sync language with i18next detection
  const detectedLang = i18next.language?.substring(0, 2) || 'nl';
  const supportedLangs = ['nl', 'en', 'de', 'fr', 'ru'];
  const activeLang = supportedLangs.includes(detectedLang) ? detectedLang : 'nl';

  if (activeLang !== app.lang) {
    app.setLanguage(activeLang);
  }
  if (ofsWindow._setActiveLang) {
    ofsWindow._setActiveLang(activeLang);
  }

  // Patch setLanguage to sync titlebar dropdown
  const origSetLang = app.setLanguage.bind(app);
  app.setLanguage = (lang: string) => {
    origSetLang(lang);
    if (ofsWindow._setActiveLang) {
      ofsWindow._setActiveLang(lang);
    }
    // Re-render the update-badge label in the new language
    runUpdateCheck();
  };

  // Kick off update check — non-blocking, silent-fail.
  setTimeout(runUpdateCheck, 500);

  // Optional deep-link: /#tab=koppelingen[&cfg=erpnext] (used by scripts/screenshot.ps1,
  // handout screenshots and support links). `cfg` opens that connector's config modal.
  try {
    const m = /(?:^|[#&])tab=([^&]+)/.exec(location.hash || '');
    const c = /(?:^|[#&])cfg=([^&]+)/.exec(location.hash || '');
    if (m && m[1] && typeof app.switchTab === 'function') {
      setTimeout(() => {
        app.switchTab(decodeURIComponent(m[1]));
        if (c && c[1] && typeof app.openConnectorConfig === 'function') {
          setTimeout(() => app.openConnectorConfig?.(decodeURIComponent(c[1])), 150);
        }
      }, 100);
    }
  } catch { /* ignore malformed hash */ }
}

if (i18next.isInitialized) {
  initApp();
} else {
  i18next.on('initialized', () => initApp());
}
