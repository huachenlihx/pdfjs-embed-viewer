// https://stackoverflow.com/questions/44070437/how-to-get-a-file-or-blob-from-an-url-in-javascript
import { useEffect, useRef, useState, useMemo, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useSWR from 'swr'
import axios, {AxiosInstance, AxiosRequestConfig, AxiosHeaders, AxiosResponse} from 'axios';
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.min.js');
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
  const [pageViewNum, setPageViewNum] = useState(1);
  const pdfPageViewNumRef = useRef(1);
  const [isPending, startTransition] = useTransition();

  const requestInit: AxiosRequestConfig = {
    method: "get",
    url,
    responseType: "blob",
  };

  // const { data, error, isLoading } =  useSWR("https://api.nytimes.com/svc/topstories/v2/us.json?api-key=126VaSBGe0agPBCGhWSGgGTbH1YGrdCP", fetcher);

  const pdfTotalPages: number = useMemo(() => {
    if (!pdf) return 0;
    return pdf.numPages;
  }, [pdf]);

  console.log('pdfTotalPages', pdfTotalPages);

  const handleError = (error: Error | undefined) => {
    console.log("Handle error", error);
};

const handleSuccess = (res: AxiosResponse) => {
    console.log("Handle success", res);
    const responseHeaders = res.headers as AxiosHeaders;
    const fileName = (responseHeaders.get('COntent-Disposition') as string)?.split("filename=")[1]; //get is case insensitive.
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

      }
  })();
};

const swrConfig = {
  onSuccess: handleSuccess,
  onError: handleError,
};

  const { data: response, error, isLoading} =  useSWR(url, async () => fetcher(requestInit as AxiosRequestConfig), swrConfig);
  console.log('data', response);
  console.log('data type', typeof response);
  console.log('error', error);
  console.log('isLoading', isLoading);

  

// useAxiosResponse({response, error, isLoading}, handleSuccess, handleError);

useEffect(() => {
  if (!pdf) return;
  
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.id = "pdf";
  canvas.style.setProperty("width", "99%", "important");
  canvas.style.setProperty("height", "auto", "important");

  const context = canvas.getContext("2d") as CanvasRenderingContext2D;

  startTransition(
    async () => {
      // const pdf = await pdfjsLib.getDocument('/assets/newspaper/chinesepress_20180406_212.pdf').promise;
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
      
  });

  return () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      canvas.remove();
  };
}, [pdf, pageViewNum]);


  return (
    <>
    {isLoading&& <p>downloading...</p>}
    {isPending&& <p>Loading pdf...</p>}
    <Select
                value={`${pageViewNum}`}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    pdfPageViewNumRef.current = pageViewNum;
                    console.log(e.target.value);
                    setPageViewNum(+e.target.value);
                    // scroll.scrollToTop({ delay: 0 }); //to page top
                }}
            >
                {Array.from({ length: pdfTotalPages }, (x, i) => i + 1).map(
                    (page) => (
                        <Option
                            key={`key-option-${page}`}
                            id={`page-option-${page}`}
                            value={`${page}`}
                        >
                            {page}
                        </Option>
                    )
                )}
            </Select>
      <Box id="pdf-container" />
    </>
  );
}