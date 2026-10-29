# PDF.js Embed Viewer

Embed PDF files in Next.js pages with a React component built on [PDF.js](https://mozilla.github.io/pdf.js/).

[![npm version](https://img.shields.io/npm/v/pdfjs-embed-viewer.svg)](https://www.npmjs.com/package/pdfjs-embed-viewer)
[![license](https://img.shields.io/npm/l/pdfjs-embed-viewer.svg)](#license)

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

## Contributing

Issues and pull requests are welcome at
[github.com/huachenlihx/pdfjs-embed-viewer](https://github.com/huachenlihx/pdfjs-embed-viewer/issues).

## License

MIT © Hua Chen
