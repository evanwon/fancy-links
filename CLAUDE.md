# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

**Project**: Firefox extension "Fancy Links" - copies formatted links with titles instead of plain URLs  
**Status**: ✅ Production-ready with comprehensive test suite

### Essential Commands
```bash
# Test extension in Firefox
web-ext run --source-dir=src

# Run all tests (REQUIRED after functional changes)
TODO: We're going to create automated tests soon.

# Build for distribution
web-ext build --source-dir=src --artifacts-dir=dist

# Check for lint/format issues
web-ext lint --source-dir=src
```

### Critical Files
- `src/formats/format-registry.js` - All format logic (slack, html, markdown, etc.)
- `src/background/background.js` - Main extension logic
- `src/manifest.json` - Extension configuration and version

## Post-Change Checklist

**CRITICAL**: After every functional change, Claude Code must:

1. **Run Tests** - TODO: We're going to create automated tests soon.

2. **Run Linting** - Extension must pass web-ext linting:
   ```bash
   web-ext lint --source-dir=src
   ```

3. **Consider Committing** - If tests and linting pass and changes are complete:
   - Reference GitHub issues in commit message if resolving them
   - Follow existing commit message style (`git log --oneline`)
   - Include concise Claude attribution for AI-assisted changes (i.e. Co-Author syntax)

4. **Version Bump** - Update `src/manifest.json` version for releases:
   - PATCH: Bug fixes, documentation
   - MINOR: New features, format additions
   - MAJOR: Breaking changes

5. **Consider Publishing** - For version bumps, consider creating a release:
   - Create git tag: `git tag v<version>` (triggers automated GitHub Actions build)
   - Push tag: `git push origin v<version>` 
   - GitHub Actions will automatically build and sign the extension for Mozilla AMO

## Project Structure

**Production Code** (`src/`):
- `background/` - Clipboard operations and format logic  
- `popup/` - Toolbar UI
- `options/` - Settings page
- `formats/` - Centralized format registry
- `utils/` - Shared utilities (browser API, clipboard, sanitization)

**Development** (root):
- `test/` - Automated test suites
- `tools/` - Development utilities  
- `design/` - Design assets and mockups

## Technical Details

### Format Registry (`src/formats/format-registry.js`)
Consolidated registry with 6 formats:
- `slack` - `<URL|Title>`
- `html` - `<a href="URL">Title</a>`  
- `markdown` - `[Title](URL)` (Discord, Reddit, GitHub, Notion)
- `plaintext` - `Title - URL`
- `rtf` - Rich Text Format for Word/Outlook
- `urlparams` - `URL?_title=Title`

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