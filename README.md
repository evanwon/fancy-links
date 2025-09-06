# Fancy Links
A browser extension that allows you to copy formatted links with titles instead of plain URLs. Perfect for sharing links in chat apps, documentation, and anywhere formatted links look better than bare URLs.

**Browser Support:**
- [Firefox](https://www.firefox.com/) (minimum version 109)

Interested in other browsers? Please vote for [Chrome support](https://github.com/evanwon/fancy-links/issues/15) or [suggest a new browser](https://github.com/evanwon/fancy-links/issues/new/choose)!

## Features

### Supported Link Formats
- **Markdown** (Reddit, Discord, Obsidian, Notion, etc.): `[Title](URL)`
- **Slack**: `<URL|Title>`
- **HTML**: `<a href="URL">Title</a>`
- **Plain Text**: `Title - URL`
- **URL Parameters**: `URL?_title=Title`
- **Rich Text Format (RTF)** (Word, Outlook, etc.): `{\rtf1\ansi\deff0 {\fonttbl {\f0 Times New Roman;}} {\field {\*\fldinst HYPERLINK "URL"} {\fldrslt {\ul\cf1 Title}}}}`

### How to Use
- **Toolbar Button**: Click to open popup with all format options
- **Keyboard Shortcut**: `Ctrl+Alt+C` (or `Cmd+Option+C` on Mac) for quick copy with default format (can be changed)
- **Live Previews**: See exactly how each format will look before copying
- **Settings Page**: Configure default format, notifications, and clean URL feature
- **Clean URLs**: Optional removal of tracking parameters (UTM, Facebook, etc.)
- **Cross-Platform**: Works consistently on Windows, macOS, and Linux

## How to Install
Note: We're working on publishing this as an [official Firefox extension](https://github.com/evanwon/fancy-links/issues/23), but in the meantime, you can install it following the instructions below.

1. Download the latest `.xpi` file from [Releases](https://github.com/evanwon/fancy-links/releases)
2. Open Firefox and navigate to [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)
3. Click "Load Temporary Add-on"
4. Select the downloaded `.xpi` file

Note that using this `about:debugging` approach will only load the plugin for your current session. Once we get this published as an official Firefox extension this will no longer be an issue.

### Development Installation
```bash
# Clone the repository
git clone https://github.com/evanwon/fancy-links.git
cd fancy-links

# Install web-ext (if not already installed)
npm install -g web-ext

# Run tests
# TODO: I plan to move this over to a standard test framework and then have a simpler command to run, see: https://github.com/evanwon/fancy-links/issues/41
node test/test-clean-url.js && node test/test-formats.js && node test/test-truncation.js && node test/test-diagnostics.js

# Run in development mode (will hot reload if you make any changes!)
web-ext run --source-dir=src

# Package the extension
web-ext build --source-dir=src --artifacts-dir=dist
```

## Usage

### Quick Copy (Keyboard Shortcut)
1. Navigate to any webpage
2. Press `Ctrl+Alt+C` or `Cmd+Option+C` on Mac
3. The formatted link is copied using your default format

### Format Selection (Popup)
1. Click the Fancy Links icon in the toolbar
2. Choose from the different link formats
3. Click any format button to copy instantly

### Settings
1. Right-click the extension icon → "Preferences"
2. Choose your default format
3. Configure notification preferences
4. Enable/disable clean URL feature to remove tracking parameters

### Customizing Keyboard Shortcuts
The default keyboard shortcut is `Ctrl+Alt+C` (or `Cmd+Option+C` on Mac), but you can customize it:

1. Go to `about:addons` in Firefox
2. Click Extensions in the sidebar
3. Click the gear icon (⚙️) → "Manage Extension Shortcuts"
4. Find "Fancy Links" and customize the shortcut
5. The popup will automatically show your custom shortcut

## Testing

### Manual Testing
1. Run `web-ext run --source-dir=src` to start development Firefox
2. Open `test/manual.html` for comprehensive testing scenarios
3. Test all format buttons and keyboard shortcut

### Automated Testing
```bash
# TODO: I plan to move this over to a standard test framework and then have a simpler command to run, see: https://github.com/evanwon/fancy-links/issues/41
node test/test-clean-url.js && node test/test-formats.js && node test/test-truncation.js && node test/test-diagnostics.js
```

## Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test thoroughly with `web-ext run --source-dir=src`
5. Commit: `git commit -m 'Crisp, specific definition of your change'`
6. Push: `git push origin feature/your-feature-name`
7. Open a Pull Request

## Project Structure

```
fancy-links/
├── src/                    # Extension source code (production files only)
│   ├── manifest.json       # Extension manifest
│   ├── background/         # Background scripts  
│   ├── popup/             # Toolbar popup UI
│   ├── options/           # Settings page
│   ├── formats/           # Format registry and logic
│   ├── utils/             # Shared utilities (clean-url, clipboard, etc.)
│   └── icons/             # Extension icons (PNG/SVG)
├── test/                  # Automated and manual tests
├── tools/                 # Development utilities
├── design/                # Design files and assets
├── .github/              # GitHub Actions workflows
└── dist/                 # Build output (generated)
```

## Development Notes
- Uses **Manifest V2** (Firefox still prefers MV2 over MV3)
- **No external dependencies** - pure HTML/CSS/JS
- **Modular architecture** for easy format addition
- **Browser-compatible format system** (avoids Node.js require() issues)
- **Clean separation** between extension code (`src/`) and development files
- **Comprehensive sanitization** prevents XSS and format-breaking

## Permissions
- `clipboardWrite`: Copy formatted text to clipboard
- `activeTab`: Access current tab's title and URL
- `storage`: Save user preferences
- `notifications`: Show copy confirmation messages

## License
This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments
Developed using [Claude Code](https://claude.ai/code), but don't worry, I included `please bro, no mistakes` multiple times in the prompt.

(In seriousness, I wanted to use this as an opportunity to try out Claude Code-first development. At least at the start of this project, I'm trying to primarily use Claude Code, and I included `CLAUDE.md` in the repo so you can see how I'm trying to guide the tool. For any Claude-driven commits, Claude will note itself as a co-author in the commit message. I'm still intervening quite a bit and haven't yet been bold enough to set it in full-auto mode, but maybe we'll get there eventually.)