// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const mocks = vi.hoisted(() => ({
  axios: vi.fn(),
  getDocument: vi.fn(),
  render: vi.fn(),
  getPage: vi.fn(),
  getViewport: vi.fn(),
  pdf: { numPages: 3 } as { numPages: number },
  loading: false,
  fetchError: undefined as Error | undefined,
}));

vi.mock('axios', () => ({ default: mocks.axios }));
vi.mock('pdfjs-dist', () => ({
  version: '3.11.174',
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: mocks.getDocument,
}));

// Replace the Radix select with an accessible native select for deterministic tests.
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, disabled }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
  }) => <select aria-label="PDF page" value={value} disabled={disabled}
    onChange={(event) => onValueChange(event.target.value)}>{children}</select>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) =>
    <option value={value}>{children}</option>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => {
    const { variant: _variant, ...buttonProps } = props;
    return <button {...buttonProps}>{children}</button>;
  },
}));

vi.mock('swr', async () => {
  const React = await import('react');
  return {
    default: (key: string, fetcher: () => Promise<unknown>, config: {
      onSuccess?: (res: unknown) => void;
      onError?: (error: Error) => void;
    }) => {
      React.useEffect(() => {
        if (mocks.loading) return;
        if (mocks.fetchError) {
          config.onError?.(mocks.fetchError);
          return;
        }
        void fetcher().then((result) => config.onSuccess?.(result)).catch(
          (error: Error) => config.onError?.(error),
        );
      }, [key]);
      return { data: undefined, error: mocks.fetchError, isLoading: mocks.loading };
    },
  };
});

import PDFViewer from '../app/components/PDFEmbedViewer';

beforeEach(() => {
  mocks.loading = false;
  mocks.fetchError = undefined;
  mocks.axios.mockReset().mockResolvedValue({ data: new Blob(['pdf bytes']) });
  mocks.getViewport.mockReset().mockReturnValue({ width: 640, height: 800 });
  mocks.render.mockReset().mockReturnValue({ promise: Promise.resolve() });
  mocks.getPage.mockReset().mockResolvedValue({ getViewport: mocks.getViewport, render: mocks.render });
  mocks.getDocument.mockReset().mockReturnValue({
    promise: Promise.resolve({ numPages: 3, getPage: mocks.getPage }),
  });
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:mock-pdf'),
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    clearRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('PDFViewer', () => {
  it('requests the PDF as a blob from the supplied URL', async () => {
    render(<PDFViewer url="https://example.com/guide.pdf" />);
    await waitFor(() => expect(mocks.axios).toHaveBeenCalledWith({
      method: 'get', url: 'https://example.com/guide.pdf', responseType: 'blob',
    }));
  });

  it('shows a downloading indicator while the PDF request is pending', () => {
    mocks.loading = true;
    render(<PDFViewer url="/guide.pdf" />);
    expect(screen.getByText('Downloading...')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'PDF page' })).toBeDisabled();
  });

  it('loads the PDF with PDF.js and renders the first page on a canvas', async () => {
    render(<PDFViewer url="/guide.pdf" />);
    await waitFor(() => expect(mocks.getDocument).toHaveBeenCalledWith('blob:mock-pdf'));
    await waitFor(() => expect(mocks.getPage).toHaveBeenCalledWith(1));
    await waitFor(() => expect(document.querySelector('#pdf-container canvas')).not.toBeNull());
    expect(mocks.render).toHaveBeenCalledWith(expect.objectContaining({
      viewport: { width: 640, height: 800 },
    }));
    const canvas = document.querySelector('#pdf-container canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(800);
    expect(canvas).toHaveAttribute('role', 'img');
    expect(canvas).toHaveAttribute('aria-label', expect.stringContaining('page 1 of 3'));
  });

  it('displays one selectable option for each PDF page', async () => {
    render(<PDFViewer url="/guide.pdf" />);
    await waitFor(() => {
      expect(screen.getAllByRole('option')).toHaveLength(3);
      expect(screen.getByRole('combobox', { name: 'PDF page' })).toHaveValue('1');
      expect(
        screen.getByText('Page 1 of 3', {
          selector: '[role="status"]',
        })
      ).toBeInTheDocument();
    });
  });

  it('moves between pages using Next, Last, Prev, and First', async () => {
    render(<PDFViewer url="/guide.pdf" />);
    await waitFor(() => expect(mocks.getPage).toHaveBeenCalledWith(1));
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'First' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(mocks.getPage).toHaveBeenCalledWith(2));
    fireEvent.click(screen.getByRole('button', { name: 'Last' }));
    await waitFor(() => expect(mocks.getPage).toHaveBeenCalledWith(3));
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Prev' }));
    await waitFor(() => expect(mocks.getPage).toHaveBeenLastCalledWith(2));
    fireEvent.click(screen.getByRole('button', { name: 'First' }));
    await waitFor(() => expect(mocks.getPage).toHaveBeenLastCalledWith(1));
  });

  it('lets users select a page directly', async () => {
    render(<PDFViewer url="/guide.pdf" />);
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3));
    fireEvent.change(screen.getByRole('combobox', { name: 'PDF page' }), {
      target: { value: '3' },
    });
    await waitFor(() => expect(mocks.getPage).toHaveBeenCalledWith(3));
  });

  it('does not attempt PDF rendering when the download fails', async () => {
    mocks.axios.mockRejectedValueOnce(new Error('Network unavailable'));
    render(<PDFViewer url="/missing.pdf" />);
    await waitFor(() => expect(mocks.axios).toHaveBeenCalledTimes(1));
    expect(mocks.getDocument).not.toHaveBeenCalled();
  });

  it('does not render a page when PDF.js rejects the document', async () => {
    mocks.getDocument.mockReturnValueOnce({ promise: Promise.reject(new Error('Invalid PDF')) });
    render(<PDFViewer url="/invalid.pdf" />);
    await waitFor(() => expect(mocks.getDocument).toHaveBeenCalledOnce());
    await waitFor(() => expect(mocks.getPage).not.toHaveBeenCalled());
  });
});

// Accessibility checks guard against regressions in semantics and keyboard-friendly controls.
describe('PDFViewer accessibility', () => {
  it('provides a named viewer region and page navigation landmark', async () => {
    render(<PDFViewer url="/guide.pdf" />);
    expect(
      screen.getByRole('region', { name: 'PDF document viewer' })
    ).toBeInTheDocument();

    expect(
      await screen.findByRole('navigation', { name: 'PDF page navigation' })
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Next' })).toHaveAccessibleName('Next');
  });

  it('announces the download state through a live status region', () => {
    mocks.loading = true;
    render(<PDFViewer url="/guide.pdf" />);
    expect(screen.getByRole('status')).toHaveTextContent('Downloading...');
  });
});
