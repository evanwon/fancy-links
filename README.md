# Firefox Fancy Links
A Firefox browser extension that allows you to copy formatted links with titles instead of plain URLs. Perfect for sharing links in chat apps, documentation, and anywhere formatted links look better than bare URLs.

## Features

### Supported Output Formats
- **Slack**: `<URL|Title>`
- **Discord**: `[Title](URL)`
- **Reddit**: `[Title](URL)`
- **Markdown**: `[Title](URL)`
- **HTML**: `<a href="URL">Title</a>`
- **Plain Text**: `Title - URL`
- **RTF**: Rich Text Format for Word/Outlook
- **URL Parameters**: `URL?_title=Title`

### Usage Options
- **Toolbar Button**: Click to open popup with all format options
- **Keyboard Shortcut**: `Ctrl+Shift+L` for quick copy with default format
- **Live Previews**: See exactly how each format will look before copying
- **Settings Page**: Configure default format and preferences

## Installation

### Normal Installation
Note: We'll eventually publish this as an official extension. Probably.

1. Download the latest `.xpi` file from [Releases](../../releases)
2. Open Firefox and navigate to `about:addons`
3. Click the gear icon → "Install Add-on From File"
4. Select the downloaded `.xpi` file

### Development Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/firefox-fancy-links.git
cd firefox-fancy-links

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
2. Choose from 8 different formats
3. Click any format button to copy instantly

### Settings
1. Right-click the extension icon → "Preferences"
2. Choose your default format
3. Configure notification preferences

## Project Structure
```
firefox-fancy-links/
├── manifest.json           # Extension configuration
├── src/
│   ├── background/         # Background script
│   ├── popup/             # Toolbar popup (HTML, CSS, JS)
│   ├── options/           # Settings page
│   ├── formats/           # Individual format modules
│   └── utils/             # Shared utilities
├── icons/                 # Extension icons (SVG)
├── test.html             # Manual testing page
├── test-formats.js       # Format testing script
└── generate-icons.html   # Icon generation tool
```

## Testing

### Manual Testing
1. Run `web-ext run` to start development Firefox
2. Open `test.html` for comprehensive testing scenarios
3. Test all format buttons and keyboard shortcut

### Format Testing
```bash
# Test all formats with sample data
node test-formats.js
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

- Developed using [Claude Code](https://claude.ai/code)