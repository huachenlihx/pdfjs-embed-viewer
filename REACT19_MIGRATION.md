# React 19 migration notes

- React and React DOM are peer dependencies (`^18.3.1 || ^19.0.0`) for consumers.
- React 19 and matching React 19 types are development dependencies.
- `jsx` is set to `react-jsx` for the modern JSX transform.
- The latest uploaded error-handling revision of `PDFEmbedViewer.tsx` is included.
- The Vitest component suite remains included.
- `npm install` must be run locally to update `package-lock.json` (network package installation unavailable here).
- Run `npm test`, `npm run typecheck`, and `npm run build`, and check the package with React 18 and React 19 consumer projects.
- The declared React 18 peer compatibility remains a target, not a verified test result.
