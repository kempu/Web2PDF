# Web to PDF

A simple Chrome browser extension that allows users to save any webpage as a PDF file while preserving its design and layout.

## Features

- **One-click PDF generation** - Save any webpage as PDF with a single click
- **Preserves design** - Maintains original webpage appearance, fonts, and colors
- **Selectable text** - Generated PDFs have fully selectable and searchable text
- **Universal compatibility** - Works on all websites, including those with strict Content Security Policies
- **No external dependencies** - Uses Chrome's built-in PDF generation capabilities

## How it works

1. Click the extension icon in your Chrome toolbar
2. The extension uses Chrome's native print functionality to generate a PDF
3. PDF is automatically downloaded with optimized settings for screen layout preservation

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The Web to PDF icon will appear in your toolbar

## Files

- `manifest.json` - Extension configuration and permissions
- `popup.html/js` - Extension popup interface
- `background.js` - Service worker handling PDF generation
- `content.js` - Injected script for browser-native PDF creation
- `icons/` - Extension icons in multiple sizes
- `lib/` - Third-party libraries (html2canvas, jsPDF) for fallback support

## Technical Details

The extension leverages Chrome's built-in PDF generation through the `chrome.debugger` API, ensuring high-fidelity output with selectable text. It requires minimal permissions (`activeTab`, `scripting`, `debugger`, `downloads`, `notifications`) and operates entirely client-side.

## Credits

- Extension icon by the [Solar Icon Set](https://github.com/480-Design/Solar-Icon-Set)
- Uses Chrome's native PDF rendering engine
- JavaScript libraries:
  - [html2canvas](https://github.com/niklasvh/html2canvas) - HTML to canvas rendering for fallback support
  - [jsPDF](https://github.com/parallax/jsPDF) - PDF generation library for client-side fallback
- Coded by Claude

---

Developed by [Klemens Arro](https://klemens.ee) with Anthropic's Claude AI.