# Accessibility notes — PDF.js Embed Viewer

Target: WCAG 2.2 AA-oriented component improvements; not a conformance claim.

## Improvements

- Named viewer region and PDF page navigation landmark.
- Accessible label for the page selector.
- Keyboard-operated page navigation using native buttons and the Radix Select keyboard pattern.
- Focus-visible outlines for page selection and buttons.
- Minimum 44px button dimensions for navigation controls.
- `role="status"` live regions for download, loading and page-number updates.
- `role="alert"` for PDF loading/render failures.
- Canvas receives a page description instead of being unlabeled.

## Crucial limitation

The canvas is an image rendering, not a screen-reader-readable PDF. These changes do not expose the content of PDF pages (text, tags, alt text, reading order). A truly accessible experience requires a tagged accessible source PDF, an accessible alternative document, or a text/semantic layer that exposes content appropriately.

## Manual checks to perform

1. Navigate through controls with Tab, Shift+Tab, Enter, Space and arrow keys.
2. Confirm visible focus at 200% and 400% zoom.
3. Confirm loading, page changes and error announcements using VoiceOver (macOS) and NVDA (Windows).
4. Run axe DevTools on the consuming page, including the open page picker.
5. Validate PDF document accessibility separately; a viewer cannot fix inaccessible content solely by setting ARIA labels.

Relevant criteria: WCAG 2.1.1 Keyboard, 2.4.7 Focus Visible, 2.4.11 Focus Not Obscured (Minimum), 2.5.8 Target Size (Minimum), 4.1.2 Name/Role/Value, 4.1.3 Status Messages.

WCAG 2.2: https://www.w3.org/TR/WCAG22/
