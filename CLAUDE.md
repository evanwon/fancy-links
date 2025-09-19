# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

**Project**: Firefox extension "Fancy Links" - copies formatted links with titles instead of plain URLs  
**Status**: ✅ Production-ready with Jest test suite

### Essential Commands
```bash
# Test extension in Firefox
web-ext run --source-dir=src

# Run tests (multiple options available)
npm test                 # Run all tests
npm run test:watch       # Watch mode for development
npm run test:coverage    # Generate coverage report
npm run test:ci          # CI optimized

# Build for distribution
web-ext build --source-dir=src --artifacts-dir=dist

# Check for lint/format issues
web-ext lint --source-dir=src
```

### Critical Files
- `src/formats/format-registry.js` - All format logic (html, markdown, etc.)
- `src/background/background.js` - Main extension logic
- `src/manifest.json` - Extension configuration and version

## Claude Workflow Triggers

**ALWAYS execute Post-Change Workflow after:**
- Modifying any `.js` files in `src/`
- Changing `src/manifest.json` 
- Adding/removing formats in `src/formats/format-registry.js`
- Updating package.json dependencies or build configuration
- Making functional changes to extension behavior

**Exception:** Documentation-only changes to `.md` files (skip workflow)

## Post-Change Workflow

**CRITICAL**: After triggering changes above, Claude Code must execute this sequence:

### 1. Validate Changes
```bash
# Test functionality (REQUIRED for all functional changes)
npm test

# Check extension compliance
web-ext lint --source-dir=src
```

### 2. Commit Changes (if validation passes)
- Reference GitHub issues in commit message if resolving them
- Follow existing commit message style (`git log --oneline`)
- Include concise Claude attribution: `Co-Authored-By: Claude <noreply@anthropic.com>`

### 3. Version Management (for releases)

#### Pre-release Versions
For testing new features before public release:

1. **Version Naming Scheme**:
   - **manifest.json**: Use two fields:
     - `version`: PREVIOUS stable + .9.N for RCs (e.g., `1.4.9.1` for 1.5.0-rc1)
     - `version_name`: Target version with suffix (e.g., `1.5.0-rc1`)
   - **Supported suffixes** (automatically detected from version_name):
     - `rc` - Release candidate (final testing before stable)
     - `beta` - Beta version (feature complete, testing needed)
     - `alpha` - Alpha version (early development, may be unstable)
   - **Examples** (for 1.4.0 → 1.5.0):
     ```json
     "version": "1.4.9.1",      // Previous stable + .9.1
     "version_name": "1.5.0-rc1"  // Target version with RC suffix
     ```
   - **Critical**: Using previous version ensures 1.4.9.1 < 1.5.0 for proper auto-updates

2. **Create pre-release**:
   ```bash
   # Update manifest.json with BOTH fields (see VERSIONING.md for details)
   # Example for 1.5.0-rc1 (assuming previous stable is 1.4.0):
   #   "version": "1.4.9.1"
   #   "version_name": "1.5.0-rc1"

   # Commit changes
   git commit -am "Prepare v1.5.0-rc1 pre-release"
   git tag v1.5.0-rc1
   git push origin v1.5.0-rc1
   ```

3. **Pre-release behavior**:
   - Automatically signed via AMO unlisted channel
   - Creates GitHub pre-release (marked as pre-release)
   - NOT submitted to AMO public listing
   - Distributed via GitHub releases page
   - Includes warning notice in release notes
   - Auto-updates to stable when released

#### Stable Releases
**Update `src/manifest.json` version:**
- PATCH: Bug fixes, documentation
- MINOR: New features, format additions
- MAJOR: Breaking changes

**Publish release:**
```bash
git tag v<version>    # Triggers automated GitHub Actions build
git push origin v<version>
```

**Note:** AMO submission is controlled by the `AMO_SUBMISSION_ENABLED` GitHub Variable.
Set to `true` in repository settings to enable automatic submission to addons.mozilla.org.

## Project Structure

**Production Code** (`src/`):
- `background/` - Main extension logic and clipboard operations  
- `popup/` - Toolbar UI
- `options/` - Settings page
- `formats/` - Centralized format registry
- `utils/` - Shared utilities (browser API, clipboard, URL cleaning, diagnostics, keyboard shortcuts)
- `icons/` - Extension icons and assets

**Development** (root):
- `test/` - Automated test suites
- `tools/` - Development utilities  
- `design/` - Design assets and mockups

## Technical Details

### Format Registry (`src/formats/format-registry.js`)
Consolidated registry with 4 formats:
- `html` - `<a href="URL">Title</a>`
- `markdown` - `[Title](URL)` (Discord, Reddit, GitHub, Notion)
- `plaintext` - `Title - URL`
- `urlparams` - `URL?_title=Page_Title`

### Browser Requirements
- Firefox 109+ with Manifest V2
- Permissions: `clipboardWrite`, `activeTab`, `storage`, `notifications`
- Support for other browsers like Chrome is expected in the future; ensure that feature development is designed with future cross-browser compatibility

## Development & Testing

### Testing Extension
- **Development**: `web-ext run --source-dir=src` (loads temporarily in Firefox)
- **Manual Testing**: Load `test/manual.html` in Firefox with extension active

### Distribution
- GitHub Actions auto-signs releases when AMO secrets are configured triggered by git tags
- Unsigned builds require Firefox Developer Edition or temporary loading

## GitHub Issues & Task Management

**All tasks tracked at**: https://github.com/evanwon/fancy-links/issues

### Labels
- `enhancement` / `bug` / `documentation` 
- `priority: high|medium|low`