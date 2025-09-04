# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

**Project Status**: ✅ Production-ready Firefox extension with comprehensive test suite  
**Current Working Directory**: `C:\Users\evanw\src\fancy-links`

### Immediate Commands
```bash
# Test the extension
web-ext run

# Run automated tests
node test/test-clean-url.js
node test/test-formats.js

# Check git status
git status

# View project structure
ls -la src/
```

### Key Files to Know
- `manifest.json` - Extension configuration
- `src/background/background.js` - Main extension logic
- `src/popup/popup.js` - Toolbar popup UI
- `src/options/options.js` - Settings page
- `src/formats/*.js` - Format modules (6 types)
- `src/utils/clean-url.js` - URL cleaning utility
- `test/` - Automated test suites and manual testing
- `tools/` - Development utilities (icon generation)
- `design/` - Design working files and assets

### Recent Work (2025-09-03 to 2025-09-04)
- ✅ Clean links feature with URL parameter removal
- ✅ Format consolidation (8→6 options for better UX)
- ✅ Fixed test suite (all tests passing)
- ✅ Comprehensive documentation updates
- ✅ Project structure reorganization (test/, tools/ directories)
- ✅ Priority-based TODO system (P0-P3 nomenclature)
- ✅ Browser-agnostic rebranding (ff-fancy-links → fancy-links)
- ✅ Updated README.md to remove Firefox-specific branding while maintaining platform clarity

## Project Overview

This is a Firefox browser extension called "Fancy Links" that allows users to copy formatted links with titles instead of plain URLs. The extension supports multiple output formats for different platforms (Slack, Discord, HTML, Markdown, etc.).

## Firefox Extension Structure

When implementing this extension, follow the standard Firefox WebExtension structure:
- `manifest.json` - Extension manifest defining permissions, browser action, keyboard shortcuts
- `src/background/background.js` - Background script for handling clipboard operations and format logic
- `src/popup/` - UI for toolbar popup (HTML/CSS/JS)
- `src/options/` - Settings page for configuring default format and preferences
- `src/utils/` - Shared utilities (browser API wrapper, clipboard, sanitization)
- `src/formats/` - Format modules for different platforms
- `icons/` - Extension icons in multiple sizes (16px, 32px, 48px, 128px)
- `test/` - Automated test suites and manual testing files
- `tools/` - Development utilities (icon generation, etc.)
- `design/` - Design working files and source assets
  - `design/icons/` - GIMP .xcf, Photoshop .psd, and other icon source files
  - `design/mockups/` - UI mockups and wireframes
  - `design/assets/` - Reference images, color palettes, design resources
  - `design/exports/` - Temporary exports before moving to production folders

## Key Implementation Notes

### Permissions Required
- `clipboardWrite` - To copy formatted text to clipboard
- `activeTab` - To get current tab's title and URL
- `storage` - To save user preferences
- `notifications` - To show copy confirmation and error messages

### Format Modules
Each link format is implemented as a separate module in `src/formats/` directory:
- `src/formats/slack.js` - Slack format (<URL|Title>)
- `src/formats/html.js` - HTML anchor tag (<a href="URL">Title</a>)
- `src/formats/markdown.js` - Markdown link format ([Title](URL)) - Used for Discord, Reddit, GitHub, Notion
- `src/formats/plaintext.js` - Plain text format (Title - URL)
- `src/formats/rtf.js` - Rich Text Format for Word/Outlook
- `src/formats/urlparams.js` - URL with title as parameter (URL?_title=Title)

Each format module should export a `format(title, url)` function.

### Browser Compatibility
- Target Firefox 109+ for modern WebExtension APIs
- Use Manifest V2 (Firefox still supports and prefers MV2)

## Development Commands

```bash
# Install web-ext globally if not installed
npm install -g web-ext

# Run extension in development mode
web-ext run

# Build extension for distribution
web-ext build

# Lint extension
web-ext lint
```

## Post-Change Checklist

**CRITICAL**: After every functional change to this project, Claude Code must consider these three items:

1. **Execute Tests** - Always run the test suite after functional changes:
   ```bash
   node test/test-clean-url.js
   node test/test-formats.js
   ```
   - Once automated tests are hooked up to PRs, this will move to automatic execution
   - Until then, manual test execution is required for all functional changes

2. **Consider Committing Changes** - Evaluate if changes should be committed:
   - Are the changes complete and functional?
   - Do tests pass?
   - Is this a logical commit point?
   - Follow the project's git commit guidelines (cohesive logical commits preferred)

3. **Consider Version Bump** - Evaluate if semver should be updated in `manifest.json`:
   - **PATCH**: Bug fixes, minor tweaks, documentation updates
   - **MINOR**: New features, format additions, backward-compatible changes  
   - **MAJOR**: Breaking changes, major architecture changes
   - Update version in `manifest.json` for significant releases

## Version Management

The extension follows [semantic versioning (semver)](https://semver.org/) principles:
- **MAJOR.MINOR.PATCH** format (e.g., 1.2.3)
- **PATCH**: Bug fixes, minor tweaks, documentation updates
- **MINOR**: New features, format additions, backward-compatible changes
- **MAJOR**: Breaking changes, major architecture changes

### Version Update Guidelines
- Update `manifest.json` version field before significant releases
- Version is automatically displayed in popup UI
- Consider version bumps for:
  - New format types → MINOR
  - New features (settings, UI improvements) → MINOR  
  - Bug fixes, test improvements → PATCH
  - Breaking API changes → MAJOR

**Current version: 1.0.0** (Production-ready with all core features)

## Git Commit Guidelines

When making commits to this repository, follow these preferences:

### Commit Organization
- **Prefer cohesive logical commits** over many small commits
- Commit early and often to make it easy to revert issues

### Commit Message Format
- Use descriptive commit messages that explain the complete scope of changes
- Follow the existing project's commit message style (see `git log --oneline` for examples)
- Include bullet points for multiple changes within the logical grouping
- For changes that were primarily done via Claude Code, include Claude Code attribution:
  ```
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

### When to Separate Commits
- Separate commits when changes are truly independent and could be reverted independently
- Feature additions vs. bug fixes should typically be separate commits
- Changes to different major components (UI vs. backend vs. tests) may warrant separate commits if they're independent
- Keep refactors or style changes separate from functional changes

## Testing Approach

- Manual testing with `web-ext run` to launch Firefox with extension loaded
- Test each format type with various URLs and page titles
- Verify keyboard shortcuts work across different pages
- Test persistence of user preferences across browser sessions
- Automated testing:
  - `node test/test-clean-url.js` - URL cleaning functionality (13 test cases, 100% pass rate)
  - `node test/test-formats.js` - Format module testing (6 formats, comprehensive test cases)
  - `test/manual.html` - Manual browser testing page with extension functionality checklist

## Session Management

If a `SESSION_SUMMARY.md` file exists in the root directory, or a `.temp/SESSION_SUMMARY.md` file exists, review it for:
- Current implementation status
- Recent work completed
- Outstanding tasks
- Known issues or decisions made

This file is temporary and used for handoffs between development sessions.

## Recent Changes (2025-09-03)

### ✅ Completed Features
1. **Clean Links Setting** - Added option to remove tracking parameters from URLs
   - New utility: `src/utils/clean-url.js` with cross-browser URL cleaning
   - Setting added to Advanced options (disabled by default)
   - Integrated into background script for all format types
   - Comprehensive test suite: `test/test-clean-url.js`

2. **Consolidated Format Options** - Grouped similar formats for better UX
   - Combined Discord, Reddit, GitHub, Notion under "Markdown Links"
   - Updated both options page and popup UI
   - Reduced format choices from 8 to 6 while maintaining functionality
   - Added "Works with" labels for clarity

3. **Removed Redundant Format Implementations** - Cleaned up duplicate code
   - Deleted `src/formats/discord.js` and `reddit.js` (identical to markdown.js)
   - Removed duplicate format definitions from `formats-browser.js` and `popup.js`
   - Updated test files to remove references to deleted modules
   - Reduced code duplication and bundle size while maintaining all functionality

4. **Fixed Test Suite** - Resolved module import issues
   - Fixed `test/test-formats.js` to use proper Node.js require() instead of eval()
   - All tests now run successfully: URL cleaning (100% pass rate), format testing (all formats working)
   - Maintained comprehensive test coverage for both URL cleaning and format generation

5. **Project Structure Reorganization** - Organized auxiliary files
   - Created `test/` directory for all testing files (automated tests, manual testing)
   - Created `tools/` directory for development utilities (icon generation)
   - Renamed `test.html` to `test/manual.html` for clarity
   - Clean root directory with only essential project files

### 📋 Task Management

**All TODO items have been migrated to GitHub Issues:** https://github.com/evanwon/fancy-links/issues

#### Current High-Priority Work
For immediate development priorities, see GitHub Issues with `priority: high` label:
- [Issue #2: Set up GitHub repository and update documentation URLs](https://github.com/evanwon/fancy-links/issues/2)  
- [Issue #3: Create fancy-links@evanw.com email address](https://github.com/evanwon/fancy-links/issues/3)
- [Issue #4: Set up automated test runner for CI/CD pipeline](https://github.com/evanwon/fancy-links/issues/4)
- [Issue #5: Evaluate architecture for plug-and-play community link format plugins](https://github.com/evanwon/fancy-links/issues/5)
- [Issue #6: Enhance format descriptions in popup UI](https://github.com/evanwon/fancy-links/issues/6)

#### Completed Priority Items
- [x] **Establish priority nomenclature system** ✅ (2025-09-04)
- [x] **Move permanent TODOs to GitHub Issues** ✅ (2025-09-04) - [Issue #1](https://github.com/evanwon/fancy-links/issues/1)  
- [x] **Review project naming for cross-browser compatibility** ✅ (2025-09-04)

#### Issue Management Workflow
- **High Priority**: Issues that should be addressed in the next development cycle
- **Medium Priority**: Issues for future releases or enhancements  
- **Low Priority**: Future considerations and nice-to-have features
- **New Issues**: Use GitHub Issues for all new tasks, bugs, and feature requests

### 🧪 Testing Notes
- URL cleaning tested with 13 test cases covering UTM, Facebook, Amazon, YouTube tracking
- Format testing covers 6 consolidated formats with 3 comprehensive test scenarios
- Format consolidation maintains backward compatibility
- All individual format modules preserved for API stability
- Test suite runs successfully with `node test/test-clean-url.js` and `node test/test-formats.js`
- Manual testing available via `test/manual.html` page
- Icon generation utility available at `tools/generate-icons.html`