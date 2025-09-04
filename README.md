# Fancy Links
A browser extension that allows you to copy formatted links with titles instead of plain URLs. Perfect for sharing links in chat apps, documentation, and anywhere formatted links look better than bare URLs.

**Currently supports:** Firefox (may support Chrome/Edge in the future - please vote for it in the issues!)

## Features

### Supported Output Formats
- **Slack**: `<URL|Title>`
- **Markdown** (Reddit, Discord, Obsidian, Notion, etc.): `[Title](URL)`
- **HTML**: `<a href="URL">Title</a>`
- **Plain Text**: `Title - URL`
- **Rich Text Format (RTF)** (Word, Outlook, etc.): `{\rtf1{\field{\*\fldinst HYPERLINK "URL"}{\fldrslt Title}}}` :dizzy_face:
- **URL Parameters**: `URL?_title=Title`

### Usage Options
- **Toolbar Button**: Click to open popup with all format options
- **Keyboard Shortcut**: `Ctrl+Shift+L` for quick copy with default format
- **Live Previews**: See exactly how each format will look before copying
- **Settings Page**: Configure default format, notifications, and clean URL feature
- **Clean URLs**: Optional removal of tracking parameters (UTM, Facebook, etc.)

## Installation

### Normal Installation
Note: We'll eventually publish this as an official extension. Probably.

1. Download the latest `.xpi` file from [Releases](https://github.com/evanwon/fancy-links/releases)
2. Open Firefox and navigate to `about:addons`
3. Click the gear icon → "Install Add-on From File"
4. Select the downloaded `.xpi` file

### Development Installation
```bash
# Clone the repository
git clone https://github.com/evanwon/fancy-links.git
cd fancy-links

# Install web-ext (if not already installed)
npm install -g web-ext

# Run in development mode
web-ext run

# Build for distribution
web-ext build
```

## Usage

### Quick Copy (Keyboard Shortcut)
1. Navigate to any webpage
2. Press `Ctrl+Shift+L`
3. The formatted link is copied using your default format

### Format Selection (Popup)
1. Click the Fancy Links icon in the toolbar
2. Choose from 6 different format categories
3. Click any format button to copy instantly

### Settings
1. Right-click the extension icon → "Preferences"
2. Choose your default format
3. Configure notification preferences
4. Enable/disable clean URL feature to remove tracking parameters

## Project Structure
```
fancy-links/
├── manifest.json           # Extension configuration
├── src/
│   ├── background/         # Background script
│   ├── popup/             # Toolbar popup (HTML, CSS, JS)
│   ├── options/           # Settings page
│   ├── formats/           # Individual format modules
│   └── utils/             # Shared utilities
├── icons/                 # Extension icons (SVG)
├── test/
│   ├── manual.html        # Manual testing page
│   ├── test-formats.js    # Format testing script
│   └── test-clean-url.js  # URL cleaning tests
└── tools/
    └── generate-icons.html # Icon generation utility
```

## Testing

### Manual Testing
1. Run `web-ext run` to start development Firefox
2. Open `test/manual.html` for comprehensive testing scenarios
3. Test all format buttons and keyboard shortcut

### Automated Testing
```bash
# Test all formats with sample data
node test/test-formats.js

# Test URL cleaning functionality
node test/test-clean-url.js
```

## Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly with `web-ext run`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Development Notes
- Uses **Manifest V2** (Firefox still prefers MV2 over MV3)
- **No external dependencies** - pure HTML/CSS/JS
- **Modular architecture** for easy format addition
- **Browser-compatible format system** (avoids Node.js require() issues)
- **Comprehensive sanitization** prevents XSS and format-breaking

## Permissions
- `clipboardWrite`: Copy formatted text to clipboard
- `activeTab`: Access current tab's title and URL
- `storage`: Save user preferences
- `notifications`: Show copy confirmation messages

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
Developed using [Claude Code](https://claude.ai/code), but don't worry, I included `please bro, no mistakes` multiple times in the prompt.

(In seriousness, I wanted to use this as an opportunity to try out Claude Code-first development. At least at the start of this project, I'm trying to primarily use Claude Code, and I included `CLAUDE.md` in the repo so you can see how I'm trying to guide the tool. For any Claude-driven commits, Claude will note itself as a co-author in the commit message. I'm still intervening quite a bit and haven't yet been bold enough to set it in full-auto mode, but maybe we'll get there eventually.)