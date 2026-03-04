# Chrome Support Implementation Plan

> **Fancy Links** is a Firefox extension (Manifest V2) that copies formatted links with page titles.
> This document provides a phased plan to add Chrome support with full feature parity.
> Each phase is self-contained, testable, and designed for autonomous execution by Claude and sub-agents.

## Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Browser API Abstraction Layer | **Complete** | Foundation — no dependencies |
| Phase 2: Build System | **Complete** | Depends on Phase 1 |
| Phase 3: Chrome MV3 Manifest and Adaptation | Not Started | Depends on Phase 1, 2 |
| Phase 4: Chrome-Specific Testing and Polish | Not Started | Depends on Phase 3 |
| Phase 5: CI/CD Pipeline for Chrome | Not Started | Depends on Phase 2, 3 |
| Phase 6: Chrome Web Store Preparation | Not Started | Depends on Phase 5 |

## Table of Contents

- [Architecture Decisions](#architecture-decisions)
- [Browser API Inventory](#browser-api-inventory)
- [Phase 1: Browser API Abstraction Layer](#phase-1-browser-api-abstraction-layer)
- [Phase 2: Build System](#phase-2-build-system)
- [Phase 3: Chrome MV3 Manifest and Adaptation](#phase-3-chrome-mv3-manifest-and-adaptation)
- [Phase 4: Chrome-Specific Testing and Polish](#phase-4-chrome-specific-testing-and-polish)
- [Phase 5: CI/CD Pipeline for Chrome](#phase-5-cicd-pipeline-for-chrome)
- [Phase 6: Chrome Web Store Preparation](#phase-6-chrome-web-store-preparation)
- [Risk Mitigation](#risk-mitigation)
- [Dependency Graph](#dependency-graph)

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Firefox manifest version | Keep MV2 | Firefox supports MV2 well; avoids risk to existing users; MV3 migration can happen separately later |
| API compatibility approach | Custom `src/utils/browser-api.js` wrapper | Extension uses a small API surface (~12 distinct APIs); avoids adding `webextension-polyfill` dependency; keeps zero-dependency philosophy; the polyfill doesn't fully bridge MV2/MV3 gaps (service workers, `scripting` API, `action` API) |
| Build system | Custom Node.js script (`tools/build.js`) | No transpilation needed; just manifest swapping, file copying, and background script concatenation for Chrome service worker; keeps things simple with no new dependencies |
| Source structure | Shared `src/` with separate `manifests/` directory | Single source of truth; build script copies the correct manifest per browser |
| Chrome MV3 background | Service worker with concatenated scripts | Concatenate background scripts into a single `service-worker.js`; Chrome MV3 requires a single service worker entry point |
| Clipboard approach | Keep current content-script architecture | Chrome MV3 service workers cannot access `navigator.clipboard` directly; current design where a content script handles clipboard writes already solves this |
| Minimum Chrome version | Chrome 102+ | Covers `chrome.scripting` (88+), Promise-based `onMessage` (99+), and stable MV3 APIs |
| Testing strategy | Dual-environment test runs | Existing test suites run under both Firefox and Chrome mocks; export pattern tests verify all 3 contexts (Node, window, service worker) |

---

## Browser API Inventory

Every `browser.*` API call in the codebase, grouped by file and category.

### `src/background/background.js` (12 calls)

| Line | API Call | Category | Chrome MV3 Equivalent |
|------|----------|----------|----------------------|
| 18 | `browser.storage.sync.get('defaultFormat')` | Storage | `chrome.storage.sync.get()` (same) |
| 32 | `browser.storage.sync.get(defaults)` | Storage | `chrome.storage.sync.get()` (same) |
| 46 | `browser.tabs.query(...)` | Tabs | `chrome.tabs.query()` (same) |
| 90 | `browser.tabs.executeScript(tab.id, { file })` | Tabs | **`chrome.scripting.executeScript({ target: { tabId }, files: [...] })`** (different) |
| 95 | `browser.tabs.sendMessage(tab.id, ...)` | Tabs | `chrome.tabs.sendMessage()` (same) |
| 135 | `browser.browserAction.setBadgeText(...)` | Action | **`chrome.action.setBadgeText()`** (renamed) |
| 136 | `browser.browserAction.setBadgeBackgroundColor(...)` | Action | **`chrome.action.setBadgeBackgroundColor()`** (renamed) |
| 140 | `browser.browserAction.setBadgeText({ text: '' })` | Action | **`chrome.action.setBadgeText()`** (renamed) |
| 146 | `browser.notifications.create({ ... })` | Notifications | **`chrome.notifications.create(id, { ... })`** (requires notification ID) |
| 148 | `browser.runtime.getURL(...)` | Runtime | `chrome.runtime.getURL()` (same) |
| 162 | `browser.commands.onCommand.addListener(...)` | Commands | `chrome.commands.onCommand.addListener()` (same) |
| 171 | `browser.runtime.onMessage.addListener(...)` | Runtime | `chrome.runtime.onMessage.addListener()` (same) |
| 195 | `browser.browserAction.onClicked.addListener(...)` | Action | **`chrome.action.onClicked.addListener()`** (renamed) |

### `src/popup/popup.js` (10 calls)

| Line | API Call | Category |
|------|----------|----------|
| 24 | `browser.runtime.getManifest()` | Runtime |
| 132 | Cross-browser detection (already handles `chrome`) | Compat |
| 177 | `browser.tabs.query(...)` | Tabs |
| 229 | `browser.runtime.openOptionsPage()` | Runtime |
| 256 | `browser.runtime.sendMessage(...)` | Runtime |
| 276 | `browser.storage.sync.set(...)` | Storage |
| 297 | `browser.storage.sync.get(...)` | Storage |
| 367 | `browser.storage.sync.get(...)` | Storage |
| 375 | `browser.tabs.create(...)` | Tabs |
| 386 | `browser.runtime.getManifest()` | Runtime |
| 391 | `browser.tabs.create(...)` | Tabs |

### `src/options/options.js` (7 calls)

| Line | API Call | Category |
|------|----------|----------|
| 34-35 | `typeof browser === 'undefined'` check (no `chrome` fallback) | Compat |
| 44 | `browser.storage.sync.get(defaults)` | Storage |
| 90 | `browser.storage.sync.get(...)` | Storage |
| 102 | `browser.storage.sync.set(settings)` | Storage |
| 121 | `browser.storage.sync.remove(knownKeys)` | Storage |
| 122 | `browser.storage.sync.set(defaults)` | Storage |
| 151 | `browser.tabs.create(...)` | Tabs |

### `src/content/clipboard-writer.js` (1 call)

| Line | API Call | Category |
|------|----------|----------|
| 12 | `browser.runtime.onMessage.addListener(...)` | Runtime |

### Already Cross-Browser Compatible (no changes needed)

| File | Notes |
|------|-------|
| `src/utils/diagnostics.js` | Has `getBrowserApi()` with `browser` → `chrome` fallback (lines 11-18). Missing `globalThis` export — only exports via `window` (line 235-241). Not blocking (only used in popup/options pages) but should be documented. |
| `src/utils/keyboard-shortcuts.js` | Inline `typeof browser !== 'undefined' ? browser : chrome` pattern |
| `src/formats/format-registry.js` | Pure formatting logic, no browser APIs. **Export bug**: `globalThis` export is nested inside `window` check (lines 142-148) — will fail silently in service workers where `window` is undefined. Also exports inconsistent name (`FancyLinkFormatRegistry` on `globalThis` vs `FancyLinkFormatConfig` on `window`). Fixed in Phase 1. |
| `src/utils/clean-url.js` | Standard `URL` API only. **Export bug**: Uses `else` branching (lines 78-85) — when `module` is undefined, it falls through to `window.FancyLinkCleanUrl`, which will throw `ReferenceError` in service workers where `window` is undefined. Fixed in Phase 1. |
| `src/utils/settings-defaults.js` | Data only, already exports via `window`, `globalThis`, and `module.exports` |

### API Differences Summary

APIs that require abstraction (not a direct `browser.*` → `chrome.*` rename):

| MV2 API (Firefox) | MV3 API (Chrome) | Difference |
|--------------------|------------------|------------|
| `browser.tabs.executeScript(tabId, { file })` | `chrome.scripting.executeScript({ target: { tabId }, files: [...] })` | Different method and argument structure; requires `scripting` permission |
| `browser.browserAction.*` | `chrome.action.*` | Renamed namespace |
| `browser.notifications.create({ ... })` | `chrome.notifications.create(id, { ... })` | Chrome requires a notification ID as the first argument |
| `window.*` globals (background) | `globalThis.*` / `self.*` globals | Service workers have no `window` object |
| `content_security_policy` (string) | `content_security_policy` (object) | MV3 uses `{ "extension_pages": "..." }` |

---

## Phase 1: Browser API Abstraction Layer

**Goal**: Create a thin abstraction layer that normalizes browser extension API access across Firefox and Chrome, and refactor all source files to use it. Firefox continues to work identically after this phase.

**Rationale**: This is the foundational change. By abstracting the API before any Chrome-specific work begins, the codebase is ready for multi-browser support and can be tested purely against Firefox to confirm zero regression.

**Dependencies**: None. This is the foundation phase.

### Fix Utility Module Export Patterns

Before any other Phase 1 work, fix the export patterns in utility modules so they work in all three contexts (Node/CommonJS, browser `window`, and service worker `globalThis`):

#### `src/formats/format-registry.js`

Restructure exports — use independent `window`, `globalThis`, and `module.exports` checks instead of nesting `globalThis` inside the `window` block. Use consistent name `FancyLinkFormatConfig` on both `window` and `globalThis`:

```javascript
// Export object
const registry = { formatConfig, getWorksWithText, getFormatKeys, getFormatConfig, formats: formatConfig };

// Node.js export for testing (CommonJS compatibility)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = registry;
}
// Service worker / global context
if (typeof globalThis !== 'undefined') {
    globalThis.FancyLinkFormatConfig = registry;
}
// Browser window context
if (typeof window !== 'undefined') {
    window.FancyLinkFormatConfig = registry;
}
```

#### `src/utils/clean-url.js`

Replace `else` branching with independent checks for `module.exports`, `globalThis`, and `window`:

```javascript
// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { cleanUrl, hasTrackingParams, TRACKING_PARAMS };
}
if (typeof globalThis !== 'undefined') {
    globalThis.FancyLinkCleanUrl = { cleanUrl, hasTrackingParams, TRACKING_PARAMS };
}
if (typeof window !== 'undefined') {
    window.FancyLinkCleanUrl = { cleanUrl, hasTrackingParams, TRACKING_PARAMS };
}
```

#### `src/utils/diagnostics.js`

Add `globalThis.Diagnostics` export alongside `window.Diagnostics` for future-proofing:

```javascript
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { collectDiagnostics, formatDiagnosticsForGitHub, generateGitHubIssueUrl };
}
if (typeof globalThis !== 'undefined') {
    globalThis.Diagnostics = { collectDiagnostics, formatDiagnosticsForGitHub, generateGitHubIssueUrl };
}
if (typeof window !== 'undefined') {
    window.Diagnostics = { collectDiagnostics, formatDiagnosticsForGitHub, generateGitHubIssueUrl };
}
```

> **Note**: `diagnostics.js` has its own `getBrowserApi()` (lines 11-18) doing the same thing as `BrowserApi.getApi()`. Once `BrowserApi` is available in the popup/options context (via script tag), `diagnostics.js` should use `BrowserApi.getApi()` internally instead of its own duplicate implementation.

#### `test/utils/export-patterns.test.js` (new file)

Tests that verify each utility module's exports work in all 3 contexts:
- **Node**: `require()` returns the expected object via `module.exports`
- **Browser**: After evaluation, `window.*` has the expected export
- **Service worker**: After evaluation with `window` undefined, `globalThis.*` has the expected export

Test all modules: `format-registry.js`, `clean-url.js`, `settings-defaults.js`, `diagnostics.js`, and `browser-api.js`.

### Chrome Mock Infrastructure

Move Chrome mock setup to Phase 1 (rather than Phase 4) so all phases can validate both Firefox and Chrome paths:

Add `setupChromeMocks()` to `test/setup.js` — a utility function that sets up `global.chrome` with the same structure as `global.browser` but using MV3 API names (`action` instead of `browserAction`, `scripting.executeScript` instead of `tabs.executeScript`).

### Files to Create

#### `src/utils/browser-api.js`

Central browser API abstraction module. Use the same universal IIFE export pattern as `format-registry.js` and `settings-defaults.js`:

```javascript
/**
 * Browser API abstraction layer for cross-browser extension support.
 * Normalizes differences between Firefox (MV2) and Chrome (MV3).
 */
(function() {
    'use strict';

    /**
     * Returns the browser extension API object.
     * Firefox provides `browser`, Chrome provides `chrome`.
     * @returns {Object|null}
     */
    function getApi() {
        if (typeof browser !== 'undefined') return browser;
        if (typeof chrome !== 'undefined') return chrome;
        return null;
    }

    /**
     * Returns the action API (browserAction in MV2, action in MV3).
     * @returns {Object|null}
     */
    function getAction() {
        const api = getApi();
        if (!api) return null;
        return api.action || api.browserAction || null;
    }

    /**
     * Returns the manifest version number.
     * @returns {number}
     */
    function getManifestVersion() {
        const api = getApi();
        if (!api) return 2;
        return api.runtime.getManifest().manifest_version;
    }

    /**
     * Sets badge text on the toolbar button.
     * @param {Object} details - { text: string }
     */
    async function setBadgeText(details) {
        const action = getAction();
        if (action) await action.setBadgeText(details);
    }

    /**
     * Sets badge background color on the toolbar button.
     * @param {Object} details - { color: string }
     */
    async function setBadgeBackgroundColor(details) {
        const action = getAction();
        if (action) await action.setBadgeBackgroundColor(details);
    }

    /**
     * Registers a listener for toolbar button clicks.
     * @param {Function} callback
     */
    function onActionClicked(callback) {
        const action = getAction();
        if (action && action.onClicked) {
            action.onClicked.addListener(callback);
        }
    }

    /**
     * Executes a content script in a tab.
     * MV2: browser.tabs.executeScript(tabId, { file })
     * MV3: chrome.scripting.executeScript({ target: { tabId }, files: [file] })
     * @param {number} tabId
     * @param {string} file - Path to the content script
     */
    async function executeContentScript(tabId, file) {
        const api = getApi();
        if (!api) throw new Error('No browser API available');

        if (getManifestVersion() >= 3 && api.scripting) {
            await api.scripting.executeScript({
                target: { tabId },
                files: [file]
            });
        } else {
            await api.tabs.executeScript(tabId, { file });
        }
    }

    /**
     * Returns the browser name based on available APIs and user agent.
     * @returns {string} 'firefox', 'chrome', or 'unknown'
     */
    function getBrowserName() {
        if (typeof browser !== 'undefined' && browser.runtime) return 'firefox';
        if (typeof chrome !== 'undefined' && chrome.runtime) return 'chrome';
        return 'unknown';
    }

    const BrowserApi = {
        getApi,
        getAction,
        getManifestVersion,
        setBadgeText,
        setBadgeBackgroundColor,
        onActionClicked,
        executeContentScript,
        getBrowserName
    };

    // Universal export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BrowserApi;
    }
    if (typeof globalThis !== 'undefined') {
        globalThis.BrowserApi = BrowserApi;
    }
    if (typeof window !== 'undefined') {
        window.BrowserApi = BrowserApi;
    }
})();
```

#### `test/utils/browser-api.test.js`

Test that:
- `getApi()` returns `browser` when available, `chrome` when `browser` is undefined, `null` when neither
- `getAction()` returns `browserAction` (MV2) or `action` (MV3)
- `setBadgeText()` delegates to the correct action API
- `setBadgeBackgroundColor()` delegates correctly
- `executeContentScript()` calls `tabs.executeScript()` on MV2 and `scripting.executeScript()` on MV3
- `getBrowserName()` returns correct values

### Files to Modify

#### `src/manifest.json`

Add `"utils/browser-api.js"` to the `background.scripts` array, before `background/background.js`:

```json
"background": {
    "scripts": [
        "formats/format-registry.js",
        "utils/settings-defaults.js",
        "utils/clean-url.js",
        "utils/browser-api.js",
        "background/background.js"
    ],
    "persistent": false
}
```

#### `src/popup/popup.html`

Add a script tag before `popup.js`:

```html
<script src="../utils/browser-api.js"></script>
<script src="popup.js"></script>
```

#### `src/options/options.html`

Add a script tag before `options.js`:

```html
<script src="../utils/browser-api.js"></script>
<script src="options.js"></script>
```

#### `src/background/background.js`

Replace all direct `browser.*` calls:

| Before | After |
|--------|-------|
| `browser.storage.sync.get(...)` | `BrowserApi.getApi().storage.sync.get(...)` |
| `browser.tabs.query(...)` | `BrowserApi.getApi().tabs.query(...)` |
| `browser.tabs.executeScript(tab.id, { file })` | `BrowserApi.executeContentScript(tab.id, file)` |
| `browser.tabs.sendMessage(...)` | `BrowserApi.getApi().tabs.sendMessage(...)` |
| `browser.browserAction.setBadgeText(...)` | `BrowserApi.setBadgeText(...)` |
| `browser.browserAction.setBadgeBackgroundColor(...)` | `BrowserApi.setBadgeBackgroundColor(...)` |
| `browser.browserAction.onClicked.addListener(...)` | `BrowserApi.onActionClicked(...)` |
| `browser.notifications.create(...)` | `BrowserApi.getApi().notifications.create(...)` |
| `browser.runtime.getURL(...)` | `BrowserApi.getApi().runtime.getURL(...)` |
| `browser.commands.onCommand.addListener(...)` | `BrowserApi.getApi().commands.onCommand.addListener(...)` |
| `browser.runtime.onMessage.addListener(...)` | `BrowserApi.getApi().runtime.onMessage.addListener(...)` |
| `window.FancyLinkFormatConfig` | `globalThis.FancyLinkFormatConfig` |
| `window.FancyLinkSettings` | `globalThis.FancyLinkSettings` |
| `window.FancyLinkCleanUrl` | `globalThis.FancyLinkCleanUrl` |

#### `src/popup/popup.js`

Replace all direct `browser.*` calls with `BrowserApi.getApi().*`. Remove the inline cross-browser detection at line 132 — `BrowserApi.getApi()` handles this now.

#### `src/options/options.js`

Replace all direct `browser.*` calls with `BrowserApi.getApi().*`. Replace the `typeof browser === 'undefined'` check (line 34-35) with a `BrowserApi.getApi()` null check.

#### `src/content/clipboard-writer.js`

Content scripts always run in page context where `window` exists. Chrome provides the `chrome` global in content scripts. Replace `browser.runtime.onMessage.addListener(...)` with a simple two-way fallback:

```javascript
const api = (typeof browser !== 'undefined') ? browser : chrome;

api.runtime.onMessage.addListener(async (message) => { ... });
```

> Note: No need for `BrowserApi` here — content scripts are injected into web pages, not the service worker, so the full abstraction layer is unnecessary. The simple `browser` vs `chrome` check covers both browsers.

#### Test Files to Update

- `test/background/background.test.js` — Add `global.BrowserApi` mock in `beforeEach`
- `test/content/clipboard-writer.test.js` — Add `global.BrowserApi` mock
- `test/popup/popup.test.js` — Add `global.BrowserApi` mock
- `test/options/options.test.js` — Add `global.BrowserApi` mock

### Verification

```bash
npm test                                           # All tests pass
web-ext lint --source-dir=src --warnings-as-errors # No lint errors
web-ext run --source-dir=src                       # Manual smoke test
```

**Manual checklist**:
- [ ] Copy link in all 4 formats from popup
- [ ] Keyboard shortcut (Alt+Shift+C) works
- [ ] Badge and notification display correctly
- [ ] Settings page loads, saves, and resets
- [ ] Bug report button opens prefilled GitHub issue
- [ ] Version click opens changelog

---

## Phase 2: Build System

**Goal**: Create a build script that generates browser-specific extension packages from shared source, and update tooling to support multi-browser builds.

**Rationale**: Before creating the Chrome manifest, the infrastructure to produce separate browser packages is needed. This phase is pure tooling; Firefox output is identical to current `web-ext build` output.

**Dependencies**: Phase 1

### Manifest Strategy

`src/manifest.json` remains the **authoritative Firefox manifest**. The `web-ext run --source-dir=src` development workflow continues to work unchanged. There is no separate `manifests/firefox/manifest.json` — the build script copies directly from `src/` for Firefox, avoiding an extra file to keep in sync.

The Chrome manifest version is injected at build time from `src/manifest.json` (or `package.json`). `version-bump.js` only updates `src/manifest.json` + `package.json` (2 files, not 3).

The `manifests/` directory contains only `manifests/chrome/manifest.json` as a template with a version placeholder.

### Files to Create

#### `tools/build.js`

Multi-browser build script (Node.js, no external dependencies):

```javascript
#!/usr/bin/env node
/**
 * Multi-browser build script for Fancy Links extension.
 * Usage: node tools/build.js --browser=firefox|chrome|all
 */
```

**Behavior**:
1. Accept `--browser=firefox|chrome|all` argument (default: `all`)
2. Create `build/<browser>/` output directories
3. Copy all shared source files from `src/`
4. **For Firefox**: Copy `src/` as-is (manifest is already in `src/manifest.json`)
5. **For Chrome MV3**:
   - Copy `manifests/chrome/manifest.json`, injecting the current version from `src/manifest.json`
   - Concatenate background scripts into a single `service-worker.js` in dependency order (read from Firefox manifest's `background.scripts` array). Wrap with `'use strict';` preamble
   - Remove individual background script files from output. Content script (`clipboard-writer.js`) remains separate
6. Print build summary

**Script concatenation order for Chrome service worker**:
1. `formats/format-registry.js`
2. `utils/settings-defaults.js`
3. `utils/clean-url.js`
4. `utils/browser-api.js`
5. `background/background.js`

#### `manifests/chrome/manifest.json`

Chrome MV3 manifest template with a version placeholder. Fully populated in Phase 3.

#### `test/tools/build.test.js`

Test that:
- Firefox build output has all expected files
- Chrome build has `service-worker.js`
- Chrome build does NOT have individual background script files
- Script concatenation order is correct
- Correct manifest is used per browser
- `--browser` flags work correctly
- **Build output validation**: Concatenated `service-worker.js` is valid JS (parseable without syntax errors), scripts are in correct order, expected `globalThis` exports are defined after evaluation

### Files to Modify

#### `package.json`

Add scripts:

```json
{
    "build:chrome": "node tools/build.js --browser=chrome",
    "build:firefox": "node tools/build.js --browser=firefox",
    "build:all": "node tools/build.js --browser=all"
}
```

> Note: The existing `build:firefox` script uses `web-ext` directly. Consider whether to keep it or replace it with the new build script. The new script handles manifest swapping; `web-ext build` can then package the `build/firefox/` output.

#### `tools/validate-versions.js`

Update to validate version consistency across `src/manifest.json`, `manifests/chrome/manifest.json`, and `package.json`.

#### `tools/version-bump.js`

Update to write version changes to `src/manifest.json` and `package.json` (2 files). The Chrome manifest template in `manifests/chrome/` uses a placeholder that is injected at build time, so it does not need direct version-bump updates.

#### `.gitignore`

Add `build/` directory. (Currently missing from `.gitignore` — must be added to prevent build output from being committed.)

#### Test Files to Update

- `test/tools/validate-versions.test.js` — Add cross-manifest validation tests
- `test/tools/version-bump.test.js` — Add multi-manifest update tests

### Verification

```bash
npm test
node tools/build.js --browser=firefox
node tools/build.js --browser=chrome
web-ext lint --source-dir=build/firefox --warnings-as-errors
```

---

## Phase 3: Chrome MV3 Manifest and Adaptation

**Goal**: Create a fully functional Chrome MV3 manifest and adapt source code for Chrome MV3 compatibility (service worker, `chrome.scripting`, `chrome.action`, permissions).

**Rationale**: With the abstraction layer and build system in place, this phase focuses on the actual Chrome MV3 differences.

**Dependencies**: Phase 1, Phase 2

### Files to Create

#### `manifests/chrome/manifest.json`

```json
{
    "manifest_version": 3,
    "name": "Fancy Links",
    "version": "1.4.5.3",
    "version_name": "1.4.6-rc3",
    "description": "Fancy Links transforms plain URLs into friendly links with included page titles. Perfect for sharing in chat apps, Reddit, GitHub, documentation, and anywhere formatted links look better than bare URLs.",
    "permissions": [
        "activeTab",
        "storage",
        "notifications",
        "scripting"
    ],
    "action": {
        "default_popup": "popup/popup.html",
        "default_icon": {
            "16": "icons/icon-16.png",
            "32": "icons/icon-32.png",
            "48": "icons/icon-48.png",
            "128": "icons/icon-128.png"
        },
        "default_title": "Copy Fancy Link"
    },
    "background": {
        "service_worker": "service-worker.js"
    },
    "commands": {
        "copy-fancy-link": {
            "suggested_key": {
                "default": "Alt+Shift+C",
                "mac": "Alt+Shift+C"
            },
            "description": "Copy the current page as a fancy link"
        }
    },
    "options_ui": {
        "page": "options/options.html",
        "open_in_tab": true
    },
    "icons": {
        "16": "icons/icon-16.png",
        "32": "icons/icon-32.png",
        "48": "icons/icon-48.png",
        "128": "icons/icon-128.png"
    },
    "content_security_policy": {
        "extension_pages": "script-src 'self'; object-src 'self'"
    }
}
```

**Key differences from Firefox MV2 manifest**:

| Field | Firefox MV2 | Chrome MV3 |
|-------|-------------|------------|
| `manifest_version` | `2` | `3` |
| `browser_specific_settings.gecko` | Present | Removed |
| `permissions` | `clipboardWrite`, `activeTab`, `storage`, `notifications` | `activeTab`, `storage`, `notifications`, **`scripting`** (no `clipboardWrite` — Chrome MV3 clipboard writes happen in the content script via `navigator.clipboard.writeText()`, which is granted through `activeTab`) |
| `browser_action` | Present | Renamed to **`action`** |
| `background.scripts` | Array of scripts | **`background.service_worker`**: single file |
| `background.persistent` | `false` | Removed (service workers are always non-persistent) |
| `content_security_policy` | String | **Object**: `{ "extension_pages": "..." }` |

### Files to Modify

#### `src/utils/browser-api.js`

The `executeContentScript()` method was already implemented in Phase 1 with MV2/MV3 detection. Verify it works correctly with the Chrome manifest.

#### `src/background/background.js`

Ensure all `window.*` references are replaced with `globalThis.*` (should already be done in Phase 1). Verify:

```javascript
// Before (Phase 1 should have changed these):
window.FancyLinkFormatConfig  →  globalThis.FancyLinkFormatConfig
window.FancyLinkSettings      →  globalThis.FancyLinkSettings
window.FancyLinkCleanUrl      →  globalThis.FancyLinkCleanUrl
```

> Note: The `clean-url.js` and `format-registry.js` export pattern fixes were completed in Phase 1. No further changes needed here.

### Verification

```bash
npm test
node tools/build.js --browser=chrome
```

**Manual verification in Chrome**:
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → select `build/chrome/`
4. Verify extension loads without errors in the console

**Manual checklist**:
- [ ] Extension loads without errors
- [ ] Popup appears when clicking the toolbar icon
- [ ] All 4 formats copy correctly
- [ ] Keyboard shortcut (Alt+Shift+C) works
- [ ] Badge appears on success/error
- [ ] Settings page loads, saves, and resets
- [ ] Bug report button works

---

## Phase 4: Chrome-Specific Testing and Polish

**Goal**: Add Chrome-specific automated tests, fix Chrome-specific issues, and handle browser-specific UX differences.

**Rationale**: Chrome has subtle behavioral differences that need explicit handling and testing.

**Dependencies**: Phase 3

### Chrome-Specific Issues to Address

#### 1. Notification ID Required

Chrome's `notifications.create()` requires a notification ID as the first argument. Firefox's `notifications.create(id?, options)` accepts an optional ID.

**Fix**: Always pass a notification ID. Both browsers work with the same call — no browser detection needed:

```javascript
await BrowserApi.getApi().notifications.create('fancy-links-' + Date.now(), {
    type: 'basic',
    iconUrl: BrowserApi.getApi().runtime.getURL('icons/icon-48.png'),
    title: title,
    message: message
});
```

#### 2. Shortcut Configuration Instructions

The hardcoded `about:addons` text is in `src/options/options.html` (line 55), not `options.js`. Chrome uses `chrome://extensions/shortcuts`.

**Fix**: Either (a) make the HTML dynamic via JS that detects the browser and updates the shortcut help text, or (b) have the build system produce browser-specific `options.html`. Option (a) is simpler:

```javascript
// In options.js, after DOM load:
const shortcutHelp = document.querySelector('.shortcut-help p');
if (BrowserApi.getBrowserName() === 'chrome') {
    shortcutHelp.textContent = 'Go to chrome://extensions/shortcuts';
}
// else: keep the Firefox-specific HTML as-is
```

#### 3. Service Worker Lifecycle

Chrome service workers unload after ~30 seconds of inactivity. The `setTimeout` for badge clearing in `background.js` may not fire if the service worker is terminated.

**Assessment**: This is non-critical — the badge clearing is cosmetic. The current 2-second timeout is short enough that it will almost always complete before termination.

**Optional mitigation**: Use `chrome.alarms` API to schedule badge clearing. This would require adding the `alarms` permission.

#### 4. `storage.sync` Quotas

Chrome has stricter quotas (8KB per item, 100KB total) vs Firefox (unlimited). Current settings are tiny (< 1KB), so this is not a concern. Document this for future reference.

#### 5. Message Handler Return Value

Chrome 99+ supports Promise returns in `onMessage`. Our Chrome 102+ minimum version covers this, so no special handling is needed. Both Firefox and Chrome can use the same Promise-returning message handler pattern.

#### 6. Minimum Chrome Version

Chrome 102+ is the minimum supported version. This should be documented in the Chrome manifest description or build output. Chrome 102+ provides:
- `chrome.scripting` API (88+)
- Promise-based `onMessage` (99+)
- Stable MV3 APIs

### Files to Create

#### `test/integration/chrome-compat.test.js`

Integration test suite simulating a Chrome MV3 environment. In addition to the basic Chrome API checks, configure **dual-environment runs** — existing test suites (background, popup, options) should run with Chrome mocks via Jest `--projects` or parameterized test setup:

- Mock `chrome.*` API (no `browser.*` global)
- Set `manifest_version: 3` in mock manifest
- Test `BrowserApi.getApi()` returns `chrome`
- Test `BrowserApi.getAction()` returns `action` (not `browserAction`)
- Test `BrowserApi.executeContentScript()` calls `scripting.executeScript()`
- Test notification with ID works identically on both browsers
- Test `globalThis` exports work (no `window`)
- Run existing background.test.js, popup.test.js, and options.test.js suites under Chrome mocks

### Files to Modify

#### `src/background/background.js`

Update `showNotification()` to always pass a notification ID (see fix above).

#### `src/options/options.html` / `src/options/options.js`

Browser-aware shortcut configuration help text (see fix above). The static HTML in `options.html` line 55 is updated dynamically by `options.js` based on browser detection.

### Verification

```bash
npm test                                           # All tests pass (Firefox + Chrome mocks)
node tools/build.js --browser=chrome
```

Load `build/chrome/` in Chrome and repeat the manual checklist from Phase 3.

---

## Phase 5: CI/CD Pipeline for Chrome

**Goal**: Update CI/CD to build, test, and package the Chrome extension alongside Firefox.

**Rationale**: Automated quality gates prevent Chrome regressions and ensure every release includes both browser packages.

**Dependencies**: Phase 2, Phase 3

### Files to Modify

#### `.github/workflows/test-pr.yml`

Add Chrome-specific validation steps:

```yaml
    - name: Build Chrome extension
      run: node tools/build.js --browser=chrome

    - name: Validate Chrome manifest
      run: |
        node -e "
          const manifest = JSON.parse(require('fs').readFileSync('build/chrome/manifest.json', 'utf8'));
          if (manifest.manifest_version !== 3) throw new Error('Chrome manifest must be MV3');
          if (!manifest.background.service_worker) throw new Error('Chrome must use service worker');
          console.log('Chrome manifest validation passed');
        "

    - name: Validate Chrome service worker
      run: |
        if [ ! -f "build/chrome/service-worker.js" ]; then
          echo "::error::service-worker.js not found in Chrome build"
          exit 1
        fi
        echo "Chrome service worker exists"
```

#### `.github/workflows/build-release.yml`

**1. Activate browser matrix** (in the `strategy` section):

```yaml
    strategy:
      matrix:
        browser: [firefox, chrome]  # Was: [firefox]
```

**2. Add Chrome build steps** (after the Firefox build steps):

```yaml
    - name: Chrome - Build extension
      if: matrix.browser == 'chrome'
      run: |
        echo "Chrome: Building extension..."
        node tools/build.js --browser=chrome

    - name: Chrome - Validate build
      if: matrix.browser == 'chrome'
      run: |
        echo "Validating Chrome build..."
        test -f build/chrome/service-worker.js
        test -f build/chrome/manifest.json
        node -e "
          const m = JSON.parse(require('fs').readFileSync('build/chrome/manifest.json', 'utf8'));
          if (m.manifest_version !== 3) throw new Error('Not MV3');
          console.log('Chrome build validated');
        "

    - name: Chrome - Create ZIP
      if: matrix.browser == 'chrome'
      run: |
        cd build/chrome
        zip -r "../../dist/fancy-links-chrome-v${{ steps.get_version.outputs.version }}.zip" .
        cd ../..
        echo "Chrome ZIP created: dist/fancy-links-chrome-v${{ steps.get_version.outputs.version }}.zip"
```

**3. Uncomment Chrome Web Store upload CLI** (in the "Install build tools" step):

```yaml
    - name: Install build tools
      run: |
        npm install -g web-ext@latest --ignore-scripts
        npm install -g chrome-webstore-upload-cli --ignore-scripts
```

**4. Update release creation** to attach Chrome ZIP alongside Firefox XPI. Add Chrome installation instructions to release notes.

**5. Add Chrome Web Store submission step** (controlled by `CWS_SUBMISSION_ENABLED`):

```yaml
    - name: Chrome - Submit to Chrome Web Store
      if: >
        matrix.browser == 'chrome' &&
        steps.release_type.outputs.is_prerelease == 'false' &&
        vars.CWS_SUBMISSION_ENABLED == 'true'
      env:
        CWS_CLIENT_ID: ${{ secrets.CWS_CLIENT_ID }}
        CWS_CLIENT_SECRET: ${{ secrets.CWS_CLIENT_SECRET }}
        CWS_REFRESH_TOKEN: ${{ secrets.CWS_REFRESH_TOKEN }}
      run: |
        if [[ -z "$CWS_CLIENT_ID" || -z "$CWS_CLIENT_SECRET" || -z "$CWS_REFRESH_TOKEN" ]]; then
          echo "Chrome Web Store credentials not configured. Skipping submission."
          exit 0
        fi

        echo "Chrome: Submitting to Chrome Web Store..."
        npx chrome-webstore-upload-cli upload \
          --source "dist/fancy-links-chrome-v${{ steps.get_version.outputs.version }}.zip" \
          --extension-id "${{ vars.CWS_EXTENSION_ID }}" \
          --client-id "$CWS_CLIENT_ID" \
          --client-secret "$CWS_CLIENT_SECRET" \
          --refresh-token "$CWS_REFRESH_TOKEN"
```

**6. Add a separate `release` job** to coordinate GitHub release creation:

A browser matrix means separate jobs. Both produce artifacts, but only one should create the GitHub release. Add a separate `release` job that `needs: [build-firefox, build-chrome]`, downloads artifacts from both browser build jobs, and creates a single GitHub release with both attachments (Firefox XPI + Chrome ZIP).

```yaml
  release:
    needs: [build-firefox, build-chrome]
    runs-on: ubuntu-latest
    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v4
        with:
          path: dist/

      - name: Create GitHub Release
        # Creates a single release with both Firefox and Chrome artifacts attached
        ...
```

> **Note**: `web-ext lint` is Firefox-specific and should only run on Firefox builds. Chrome build validation uses the manifest validation script (step 2 above), not `web-ext lint`.

### Verification

```bash
# Locally: simulate CI steps
npm test
node tools/build.js --browser=all
web-ext lint --source-dir=build/firefox --warnings-as-errors  # Firefox only
```

---

## Phase 6: Chrome Web Store Preparation

**Goal**: Prepare for Chrome Web Store submission with CWS-specific metadata, store assets, and documentation updates.

**Rationale**: The Chrome Web Store has its own requirements for listing descriptions, screenshots, and promotional images separate from AMO.

**Dependencies**: Phase 5

### Files to Create

#### `manifests/chrome/store-description.txt`

Store listing description for the Chrome Web Store. Based on the existing extension description with Chrome-specific installation instructions.

#### `store-assets/chrome/`

Directory for Chrome Web Store assets:
- Screenshots (1280x800 or 640x400)
- Promotional images (optional: 440x280 small tile, 920x680 large tile)
- Use the same functional screenshots as Firefox but captured in Chrome

### Files to Modify

#### `package.json`

Add `"chrome"` to keywords:

```json
"keywords": [
    "firefox",
    "chrome",
    "extension",
    "link",
    "clipboard",
    "markdown"
]
```

### Repository Configuration Required

The following GitHub secrets and variables must be configured before CWS submission:

| Name | Type | Description |
|------|------|-------------|
| `CWS_CLIENT_ID` | Secret | Chrome Web Store API client ID |
| `CWS_CLIENT_SECRET` | Secret | Chrome Web Store API client secret |
| `CWS_REFRESH_TOKEN` | Secret | Chrome Web Store API refresh token |
| `CWS_EXTENSION_ID` | Variable | Chrome Web Store extension ID (assigned after first manual upload) |
| `CWS_SUBMISSION_ENABLED` | Variable | Set to `true` to enable automated CWS uploads (mirrors `AMO_SUBMISSION_ENABLED` pattern) |

### Verification

- [ ] Store description is accurate and within CWS character limits
- [ ] Screenshots show Chrome browser chrome (not Firefox)
- [ ] GitHub secrets/variables are configured
- [ ] A manual test upload to CWS succeeds

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Firefox regression | Low | High | Phase 1 includes export pattern fixes and API abstraction; all existing tests must pass before proceeding. Firefox-specific `web-ext lint` runs in every phase. |
| Service worker lifecycle issues | Medium | Low | Content script handles clipboard (not service worker). Badge timeout is non-critical (cosmetic only). Test with Chrome DevTools service worker termination. |
| Chrome API differences missed | Low | Medium | Comprehensive API inventory completed (30+ calls across 4 files). Chrome-specific integration tests in Phase 4 catch runtime issues. |
| Build system complexity | Low | Medium | Deliberately simple Node.js script with no dependencies. No bundling, no transpilation. Just file copying and script concatenation. |
| Version sync across manifests | Medium | Medium | `validate-versions.js` updated in Phase 2 to validate all manifest files. `version-bump.js` writes to all manifests. CI enforces validation. |
| `storage.sync` quota exceeded | Very Low | Low | Current settings total < 1KB. Chrome quota is 100KB total, 8KB per item. Not a concern unless settings grow dramatically. |
| `setTimeout` in service worker | Medium | Very Low | Badge clearing is purely cosmetic. 2-second timeout is short enough to complete before worker termination in most cases. Can optionally use `chrome.alarms` API later. |
| `globalThis`/`window` export patterns break in service worker | Medium | High | Fixed in Phase 1 with independent export checks for `module.exports`, `globalThis`, and `window`; verified by `test/utils/export-patterns.test.js` across all 3 contexts (Node, browser, service worker) |

---

## Dependency Graph

```
Phase 1: Browser API Abstraction    (foundation; no Chrome yet)
    │
    ├──→ Phase 2: Build System      (infrastructure for multi-browser)
    │        │
    │        └──→ Phase 3: Chrome MV3 Manifest + Adaptation
    │                 │
    │                 ├──→ Phase 4: Chrome Testing & Polish
    │                 │
    │                 └──→ Phase 5: CI/CD for Chrome
    │                          │
    │                          └──→ Phase 6: Chrome Web Store
    │
    └──→ (Firefox continues to work at every phase)
```

Each phase results in a **working, testable state**. The extension can be released for Firefox at any point with zero regression. Chrome support becomes functional after Phase 3 and production-ready after Phase 5.
