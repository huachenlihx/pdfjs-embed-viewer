import * as React from "react"
import { useEffect, useRef, useState, useMemo, useTransition } from "react";
import useSWR from 'swr'
import axios, {AxiosRequestConfig, AxiosHeaders, AxiosResponse} from 'axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from "@/components/ui/button"
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
 
console.log("pdfjsLib version", pdfjsLib.version);

const fetcher = async (
  request: AxiosRequestConfig<any>,
) => {
  try {
      return await axios(request);
  } catch (e) {
      console.log('typeof e', typeof e);
      console.log('e', e);
      throw e; // e is an object, we have to parse it in page.tsx or component - Hua
  }

};


interface IRequestConfig {
  method: string;
  url: string;
  headers?: object;
  data?: object
};

export default function PDFViewer({url}: {url:string}) {
  const [pdf, setPDF] = useState<pdfjsLib.PDFDocumentProxy>();
  const [pageViewNum, setPageViewNum] = useState(0);
  const [isPending, startTransition] = useTransition();

  const requestInit: AxiosRequestConfig = {
    method: "get",
    url,
    responseType: "blob",
  };

  // const { data, error, isLoading } =  useSWR("https://api.nytimes.com/svc/topstories/v2/us.json?api-key=126VaSBGe0agPBCGhWSGgGTbH1YGrdCP", fetcher);

  const pdfTotalPages: number = useMemo(() => {
    if (!pdf) return 0;
    setPageViewNum(1);
    return pdf.numPages;
  }, [pdf]);

  console.log('pdfTotalPages', pdfTotalPages);

  const handleError = (error: Error | undefined) => {
    console.log("Handle error", error);
};

const handleSuccess = (res: AxiosResponse) => {
    console.log("Handle success", res);
    const pdfDocument: pdfjsLib.PDFDocumentLoadingTask =
            pdfjsLib.getDocument(window.URL.createObjectURL(new Blob([res.data as Blob])));
    (async () => {
      try {
          const pdfData = await pdfDocument.promise;
          setPDF(pdfData);
      } catch (e: any) {
          console.log("e", e);
          console.log("e.message", e.message);
      } finally {
        console.log('PDF has been loaded!');
      }
  })();
};

const swrConfig = {
  onSuccess: handleSuccess,
  onError: handleError,
};

  const { data: response, error, isLoading} =  useSWR(url, async () => fetcher(requestInit), swrConfig);


useEffect(() => {
  if (!pdf) return;
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.id = "pdf";
  canvas.style.setProperty("width", "99%", "important");
  canvas.style.setProperty("height", "auto", "important");

  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  startTransition(()=>{

  (
    async () => {
      try{
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
          document.getElementById("pdf-container")?.replaceChildren(canvas);
          console.log("Page rendered!");
      } catch (e: any) {
          
          const ee = e as pdfjsLib.RenderingCancelledException;
          if(ee) {
             console.log(`Manually cancelled: ${ee.message}`);
          }else {
            console.log(e.message);
          }
      }finally {
          // setLoading(false);
      }
      
  })();
});

  return () => {
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