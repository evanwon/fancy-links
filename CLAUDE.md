# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

**Project Status**: ✅ Production-ready Firefox extension with comprehensive test suite  
**Current Working Directory**: `C:\Users\evanw\src\ff-fancy-links`

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

### Recent Work (2025-09-03)
- ✅ Clean links feature with URL parameter removal
- ✅ Format consolidation (8→6 options for better UX)
- ✅ Fixed test suite (all tests passing)
- ✅ Comprehensive documentation updates
- ✅ Project structure reorganization (test/, tools/ directories)
- ✅ Priority-based TODO system (P0-P3 nomenclature)

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

### 📋 Current TODO List

#### P0 (Critical - Do Next)
- [ ] **Establish priority nomenclature system**
  - Define P0 (critical/do next), P1 (high), P2 (medium), P3 (low) priority levels
  - Re-categorize all existing TODO items using new priority system
  - Update CLAUDE.md documentation to reflect priority workflow

#### P1 (High Priority)
- [ ] **Create fancy-links@evanw.com email address**
  - Email address is used as addon ID in manifest.json but doesn't exist
  - Needed for potential Mozilla Add-ons store submission or support requests
  - Could be an alias or forwarding address

- [ ] **Set up automated test runner for CI/CD pipeline** 
  - Integrate test suite into GitHub Actions or similar
  - Add test running to build process
  - Consider proper test framework (Jest, Mocha, etc.)

- [ ] **Migrate task tracking to GitHub Issues**
  - Move medium/future priority items from CLAUDE.md to GitHub Issues
  - Set up issue templates for bugs, features, and enhancements
  - Establish workflow linking issues to commits and PRs
  - Keep only high-priority current work items in CLAUDE.md

- [ ] **Enhance format descriptions in popup UI**
  - Extend "Works with" pattern from Markdown to other formats
  - Add popular app examples for RTF (Word, Outlook, etc.)
  - Research and document which apps support each format best
  - Improve user understanding of when to use each format

#### P2 (Medium Priority)
- [ ] **Cross-browser compatibility testing**
  - Test extension in Chrome/Edge (Manifest V2 compatibility)
  - Verify clean-url utility works across all browsers

- [ ] **Re-evaluate manifest.json location**
  - Research if manifest should be in src/ directory instead of root
  - Compare with other browser extension projects on GitHub
  - Consider impact on build process and web-ext tooling

- [ ] **Review project naming for cross-browser compatibility**
  - Remove Firefox-specific identifiers from project name and documentation
  - Plan for future Chrome/Edge support with unified codebase
  - Consider renaming repository to be browser-agnostic (e.g. fancy-links vs ff-fancy-links)

- [ ] **Customizable format ordering in popup**
  - Allow users to reorder link formats via drag-and-drop
  - Persist user's preferred format order in extension storage
  - Add simple interface in options page for format management
  - Consider most-used formats floating to top automatically

- [ ] **Mobile Firefox support**
  - Research mobile Firefox extension capabilities and limitations
  - Test current extension behavior on mobile Firefox
  - Adapt UI for touch interfaces and smaller screens
  - Ensure clipboard operations work on mobile

#### P3 (Future Enhancements)
- [ ] **Additional format types**
  - Consider adding BBCode format for forums
  - Wiki markup format support
  
- [ ] **Advanced URL cleaning**
  - Add whitelist/blacklist for specific domains
  - Custom tracking parameter configuration
  
- [ ] **Export/Import settings**
  - Allow users to backup/restore their preferences

### 🧪 Testing Notes
- URL cleaning tested with 13 test cases covering UTM, Facebook, Amazon, YouTube tracking
- Format testing covers 6 consolidated formats with 3 comprehensive test scenarios
- Format consolidation maintains backward compatibility
- All individual format modules preserved for API stability
- Test suite runs successfully with `node test/test-clean-url.js` and `node test/test-formats.js`
- Manual testing available via `test/manual.html` page
- Icon generation utility available at `tools/generate-icons.html`