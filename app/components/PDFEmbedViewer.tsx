import * as React from "react"
import { useEffect, useState, useTransition } from "react";
import useSWR from 'swr'
import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from "@/components/ui/button";
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

const fetcher = (request: AxiosRequestConfig) => axios(request);


interface IRequestConfig {
  method: string;
  url: string;
  headers?: object;
  data?: object
};

export default function PDFViewer({url}: {readonly url:string}) {
  const [pdf, setPDF] = useState<pdfjsLib.PDFDocumentProxy>();
  const [pageViewNum, setPageViewNum] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [viewerError, setViewerError] = useState<string | null>(null);

  const requestInit: AxiosRequestConfig = {
    method: "get",
    url,
    responseType: "blob",
  };

  const pdfTotalPages = pdf?.numPages ?? 0;

  useEffect(() => {
    setPageViewNum(pdf ? 1 : 0);
  }, [pdf]);


const handleSuccess = (res: AxiosResponse) => {
    setViewerError(null);

    const pdfDocument: pdfjsLib.PDFDocumentLoadingTask =
            pdfjsLib.getDocument(window.URL.createObjectURL(new Blob([res.data as Blob])));
    void (async () => {
      try {
          const pdfData = await pdfDocument.promise;
          setPDF(pdfData);
      } catch {
          setPDF(undefined);
          setViewerError("The downloaded file could not be opened as a PDF.");
      }
  })();
};

const swrConfig = {
  onSuccess: handleSuccess,
};

const { isLoading, error: downloadError } = useSWR(
  url,
  () => fetcher(requestInit),
  swrConfig,
);

const isNavigationUnavailable =
  isLoading || isPending || !pdf || pageViewNum < 1;


useEffect(() => {
  if (!pdf) return;
  if (pageViewNum < 1) return;
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", `Visual rendering of PDF page ${pageViewNum} of ${pdf.numPages}. The canvas itself does not expose PDF text to screen readers.`);
  canvas.id = "pdf";
  canvas.style.setProperty("width", "99%", "important");
  canvas.style.setProperty("height", "auto", "important");

  const context = canvas.getContext("2d");
  if (!context) {
    setViewerError("PDF canvas rendering is not supported in this browser.");
    return;
  }
  let cancelled = false;
  startTransition(() => {
    void (async () => {
      try {
          setViewerError(null);
          // Load information from the first page.
          const page = await pdf.getPage(pageViewNum);
          const viewport = page.getViewport({ scale: 1 });

          canvas.height = viewport.height;
          canvas.width = viewport.width;
          context.clearRect(0, 0, canvas.width, canvas.height);

          const renderContext = {
              canvasContext: context,
              viewport: viewport,
          };

          const pdfPageRender = page.render(renderContext);

          await pdfPageRender.promise; //We have to use the property, promise, here - Hua
          if (!cancelled) {
            document.getElementById("pdf-container")?.replaceChildren(canvas);
          }
      } catch {
          if (!cancelled) {
            setViewerError("Unable to render this PDF page. Please try another page.");
          }
      }
    })();
  });

  return () => {
      cancelled = true;
      context.clearRect(0, 0, canvas.width, canvas.height);
      canvas.remove();
  };
}, [pdf, pageViewNum]);


  return (
    <section aria-label="PDF document viewer" className="text-center">
    <Select
      disabled={isLoading || !pdf || pageViewNum < 1}
      onValueChange={(value) => setPageViewNum(+value)}
      defaultValue={pageViewNum.toString()}
      value={pageViewNum.toString()}
      >
        <SelectTrigger
          aria-label="PDF page"
          className="w-[180px] min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <SelectValue placeholder='Select a page' />
        </SelectTrigger>
        <SelectContent className="w-[180px]">
        {Array.from({ length: pdfTotalPages }, (x, i) => i + 1).map(
            (page) => (
              <SelectItem className="w-[180px]" key={`key-option-${page}`} value={`${page}`}>
                {page}
              </SelectItem>
            )
        )}
        </SelectContent>
      </Select>
      {isLoading && <p role="status" aria-live="polite">Downloading...</p>}
      {isPending && <p role="status" aria-live="polite">Loading...</p>}
      {pdfTotalPages > 0 && !isLoading && pageViewNum > 0 && (
        <p role="status" aria-live="polite" aria-atomic="true">
          Page {pageViewNum} of {pdfTotalPages}
        </p>
      )}
      {(downloadError || viewerError) && (
        <p role="alert">
          {downloadError ? "Unable to download the PDF. Please try again." : viewerError}
        </p>
      )}
      <div id="pdf-container" aria-label="Rendered PDF page" />
      {pdfTotalPages > 0 && !isLoading &&
        <nav aria-label="PDF page navigation" className="flex flex-wrap justify-center gap-2">
        <Button variant="secondary" disabled={isNavigationUnavailable || pageViewNum === 1} onClick={()=>setPageViewNum(prev => prev-1)} className="space-x-0.5 min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Prev</Button>
        <Button variant="secondary" disabled={isNavigationUnavailable || pageViewNum === pdfTotalPages} onClick={()=>setPageViewNum(next => next+1)} className="space-x-0.5 min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Next</Button>
        <Button variant="secondary" disabled={isNavigationUnavailable || pageViewNum === 1} onClick={()=>setPageViewNum(1)} className="space-x-0.5 min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">First</Button>
        <Button variant="secondary" disabled={isNavigationUnavailable || pageViewNum === pdfTotalPages} onClick={()=>setPageViewNum(pdfTotalPages)} className="space-x-0.5 min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Last</Button>
        </nav>
      }
    </section>
  );
}
