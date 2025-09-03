# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Key Implementation Notes

### Permissions Required
- `clipboardWrite` - To copy formatted text to clipboard
- `activeTab` - To get current tab's title and URL
- `storage` - To save user preferences
- `notifications` - To show copy confirmation and error messages

### Format Modules
Each link format should be implemented as a separate module in `src/formats/` directory:
- `src/formats/slack.js` - Slack format (<URL|Title>)
- `src/formats/discord.js` - Discord format ([Title](URL))
- `src/formats/reddit.js` - Reddit format ([Title](URL))
- `src/formats/html.js` - HTML anchor tag (<a href="URL">Title</a>)
- `src/formats/markdown.js` - Markdown link format ([Title](URL))
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

## Testing Approach

- Manual testing with `web-ext run` to launch Firefox with extension loaded
- Test each format type with various URLs and page titles
- Verify keyboard shortcuts work across different pages
- Test persistence of user preferences across browser sessions

## Session Management

If a `SESSION_SUMMARY.md` file exists, review it for:
- Current implementation status
- Recent work completed
- Outstanding tasks
- Known issues or decisions made

This file is temporary and used for handoffs between development sessions.