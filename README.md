# PDF.js Embed Viewer

Embed PDF files in Next.js pages with a React component built on [PDF.js](https://mozilla.github.io/pdf.js/).

[![npm version](https://img.shields.io/npm/v/pdfjs-embed-viewer.svg)](https://www.npmjs.com/package/pdfjs-embed-viewer)
[![license](https://img.shields.io/npm/l/pdfjs-embed-viewer.svg)](#license)

## Demo — Next.js Integration

The screenshot below shows `pdfjs-embed-viewer` running in a Next.js 16 App Router application with React 19 and TypeScript. The demo displays a PDF document, an accessible page selector, and Previous / Next / First / Last navigation controls. The PDF canvas scrolls independently while navigation remains visible.

![PDF.js Embed Viewer integrated into Next.js, showing a PDF document with page selection and navigation controls](https://raw.githubusercontent.com/huachenlihx/pdfjs-embed-viewer/master/screenshots/pdf-viewer-demo.png)

## Features

- Drop-in React component: pass a PDF URL and it renders in your page
- Built on `pdfjs-dist` (PDF.js)
- Written in TypeScript, with bundled type declarations
- Ships both CommonJS and ES module builds

## Requirements

- React 18+
- Next.js (or any React 18 app)

## Installation

```bash
npm install pdfjs-embed-viewer
```

## Usage

```tsx
"use client"; // required when using the Next.js App Router

import PDFEmbedViewer from "pdfjs-embed-viewer";

export default function Page() {
  return <PDFEmbedViewer url="https://example.com/files/list.pdf" />;
}
```

The PDF must be reachable from the browser. If it is hosted on another
domain, that server needs to allow cross-origin (CORS) requests.

## Props

| Prop  | Type     | Description                |
| ----- | -------- | -------------------------- |
| `url` | `string` | URL of the PDF to display  |

## Development

```bash
git clone https://github.com/huachenlihx/pdfjs-embed-viewer.git
cd pdfjs-embed-viewer
npm install
npm run build   # bundles with tsup into dist/
```

## Automated testing

The project uses **Vitest**, **React Testing Library**, and **jsdom** for component unit tests. The PDF.js document loader, browser canvas, and network requests are mocked so tests do not need a live PDF or external server.

```bash
npm install
npm test                 # Run tests once
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
```

Open the HTML coverage report on macOS with `open coverage/index.html` after generating it. The generated `coverage/` directory is ignored by Git.

The tests cover blob requests, download state, PDF loading and canvas rendering, page selection and navigation, and failure cases. They do not replace real-browser validation with actual PDF documents.

**Dependency note:** After extracting this update, run `npm install` to install the new test dependencies and refresh `package-lock.json`. Commit the regenerated lockfile. `react-dom` is pinned to React 18 to avoid React 18/19 peer-dependency conflicts.

## Contributing

Issues and pull requests are welcome at
[github.com/huachenlihx/pdfjs-embed-viewer](https://github.com/huachenlihx/pdfjs-embed-viewer/issues).

## Accessibility (WCAG 2.2 AA-oriented)

The viewer includes a named document region and navigation landmark, an accessible page selector, keyboard-operated navigation buttons, visible focus styles, touch-friendly button targets, live announcements for loading and page changes, and error alerts. Automated tests cover several of these accessibility behaviors.

**Important limitation:** PDF.js currently renders document pages to a canvas. An accessible label for the canvas does **not** expose the PDF's actual text, reading order, tables, or structure to screen readers. Full document accessibility requires an accessible PDF or a separate tagged/text-based viewing experience. Accordingly, this library does **not** claim WCAG 2.2 AA conformance.

To review accessibility, navigate by keyboard, test with VoiceOver/NVDA, run axe on a consuming application, and inspect focus visibility at high zoom. See [ACCESSIBILITY.md](ACCESSIBILITY.md).




## React compatibility (React 18 and React 19)

The library declares `react` and `react-dom` as peer dependencies supporting React 18.3.1+ and React 19. Local development and testing use React 19; React is not bundled as a runtime dependency of the library. Both React versions must be installed in a consuming application and should be on matching major versions.

### Verify the upgrade

```bash
npm install
npm ls react react-dom
npm test
npm run typecheck
npm run build
```

The included `package-lock.json` is from the previous installation. **Run `npm install` to regenerate it before `npm ci`**, then commit the refreshed lockfile. Test the published package in React 18 and React 19 consuming apps before describing both versions as verified.

The viewer now displays PDF load/render failures as messages rather than silently ignoring them.

## License

MIT © Hua Chen
