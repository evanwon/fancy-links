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
- `src/formats/format-registry.js` - Centralized format registry with all format logic
- `src/utils/clean-url.js` - URL cleaning utility
- `src/shared/` - Shared utilities and configurations
- `test/` - Automated test suites and manual testing
- `tools/` - Development utilities (icon generation)
- `design/` - Design working files and assets

## Project Overview

This is a Firefox browser extension called "Fancy Links" that allows users to copy formatted links with titles instead of plain URLs. The extension supports multiple output formats for different platforms (Slack, Discord, HTML, Markdown, etc.).

## Firefox Extension Structure

When implementing this extension, follow the standard Firefox WebExtension structure:
- `manifest.json` - Extension manifest defining permissions, browser action, keyboard shortcuts
- `src/background/background.js` - Background script for handling clipboard operations and format logic
- `src/popup/` - UI for toolbar popup (HTML/CSS/JS)
- `src/options/` - Settings page for configuring default format and preferences
- `src/utils/` - Shared utilities (browser API wrapper, clipboard, sanitization)
- `src/formats/` - Format registry with centralized format logic
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

### Format Registry
All link formats are consolidated in a single registry file:
- `src/formats/format-registry.js` - Universal format registry with all format configurations and logic
  - `slack` - Slack format (<URL|Title>)
  - `html` - HTML anchor tag (<a href="URL">Title</a>)
  - `markdown` - Markdown link format ([Title](URL)) - Used for Discord, Reddit, GitHub, Notion
  - `plaintext` - Plain text format (Title - URL)
  - `rtf` - Rich Text Format for Word/Outlook
  - `urlparams` - URL with title as parameter (URL?_title=Title)

The registry exports format configurations with metadata, sanitizers, and format functions. It supports ES6 modules, CommonJS, and global contexts.

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

**CRITICAL**: After every functional change to this project, Claude Code must consider these five items:

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
   - What GitHub Issues need to be referenced / linked / resolved as a result of this work? IMPORTANT: If the change resolves an open GitHub issue, reference that issue in the first line of the commit message.

3. **Consider Version Bump** - Evaluate if semver should be updated in `manifest.json`:
   - **PATCH**: Bug fixes, minor tweaks, documentation updates
   - **MINOR**: New features, format additions, backward-compatible changes  
   - **MAJOR**: Breaking changes, major architecture changes
   - Update version in `manifest.json` for significant releases

4. **Consider Building/Packaging** - Evaluate if extension should be built and released:
   - For significant releases, build extension with `web-ext build`
   - Create GitHub Release with `.xpi` file attachment
   - Eventually: Automated process to push to Mozilla Add-ons store
   - Coordinate with version bumps for logical release points

5. **Push to Remote Repository** - Keep GitHub repository synchronized:
   - Push commits to `origin/master` after completing logical changes
   - Ensure GitHub Issues and documentation stay in sync with local work
   - Required for team collaboration and public visibility of changes

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

**Current version: 1.0.2** (Production-ready with consolidated format architecture)

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
- Manual testing with `web-ext run --verbose` to launch Firefox with extension loaded
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

### Task Management

**All tasks are stored in GitHub Issues:** https://github.com/evanwon/fancy-links/issues

#### Available GitHub Labels
When creating issues, use these available labels appropriately:

**Primary Labels (use frequently):**
- `enhancement` - New features or improvements (most common)
- `bug` - Something isn't working correctly
- `documentation` - Documentation improvements or additions

**Priority Labels (always include one):**
- `priority: high` - Issues for next development cycle
- `priority: medium` - Future releases or enhancements  
- `priority: low` - Future considerations and nice-to-have features

**Special Purpose Labels (use sparingly):**
- `good first issue` - For simple tasks suitable for new contributors
- `help wanted` - When external input/assistance would be valuable
- `question` - For clarification requests (consider GitHub Discussions instead)

**Labels to avoid:**
- `duplicate`, `invalid`, `wontfix` - Better to close issues with clear explanations

#### Issue Management Workflow
- **High Priority**: Issues that should be addressed in the next development cycle
- **Medium Priority**: Issues for future releases or enhancements  
- **Low Priority**: Future considerations and nice-to-have features
- **New Issues**: Use GitHub Issues for all new tasks, bugs, and feature requests

### Testing Notes
- URL cleaning tested with 13 test cases covering UTM, Facebook, Amazon, YouTube tracking
- Format testing covers 6 consolidated formats with 3 comprehensive test scenarios
- Format consolidation maintains backward compatibility
- Format architecture consolidated into single registry for better maintainability
- Test suite runs successfully with `node test/test-clean-url.js` and `node test/test-formats.js`
- Manual testing available via `test/manual.html` page
- Icon generation utility available at `tools/generate-icons.html`