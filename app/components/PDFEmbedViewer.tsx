import * as React from "react"
import { useEffect, useState, useMemo, useTransition } from "react";
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

  const pdfTotalPages: number = useMemo(() => {
    if (!pdf) return 0;
    setPageViewNum(1);
    return pdf.numPages;
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


useEffect(() => {
  if (!pdf) return;
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.id = "pdf";
  canvas.style.setProperty("width", "99%", "important");
  canvas.style.setProperty("height", "auto", "important");

  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
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
    <div className="text-center">
    <Select
      disabled={isLoading}
      onValueChange={(value) => setPageViewNum(+value)}
      defaultValue={pageViewNum.toString()}
      value={pageViewNum.toString()}
      >
        <SelectTrigger className="w-[180px]">
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
      {isLoading && <p>Downloading...</p>}
      {isPending && <p>Loading...</p>}
      {(downloadError || viewerError) && (
        <p role="alert">
          {downloadError ? "Unable to download the PDF. Please try again." : viewerError}
        </p>
      )}
      <div id="pdf-container" />
      {(!isLoading || pageViewNum !== 0) &&
        <>
        <Button variant="secondary" disabled={isPending || pageViewNum === 1} onClick={()=>setPageViewNum(prev => prev-1)} className="space-x-0.5">Prev</Button>
        <Button variant="secondary" disabled={isPending  || pageViewNum === pdfTotalPages} onClick={()=>setPageViewNum(next => next+1)} className="space-x-0.5">Next</Button>
        <Button variant="secondary" disabled={isPending || pageViewNum === 1} onClick={()=>setPageViewNum(1)} className="space-x-0.5">First</Button>
        <Button variant="secondary" disabled={isPending  || pageViewNum === pdfTotalPages} onClick={()=>setPageViewNum(pdfTotalPages)}>Last</Button>
        </>
      }
    </div>
  );
}
