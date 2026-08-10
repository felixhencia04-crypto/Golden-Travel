import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, RotateCcw, Download, ExternalLink, FileText, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { downloadFile, openDataUrlInNewTab, isImageUrl, isPdfUrl, getBlobUrlFromDataUrl } from '../utils/file';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  title?: string;
  className?: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, title = 'Dokumen', className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Image specific states
  const [imgSrc, setImgSrc] = useState<string>('');
  const [imgLoading, setImgLoading] = useState<boolean>(true);
  const [imgError, setImgError] = useState<boolean>(false);
  const [forceImageMode, setForceImageMode] = useState<boolean>(false);

  const isImage = isImageUrl(url) || forceImageMode;

  // Reset controls state whenever URL changes
  useEffect(() => {
    setScale(1.0);
    setRotation(0);
    setError(null);
    setImgError(false);
    setForceImageMode(false);
  }, [url]);

  // Handle image preparation
  useEffect(() => {
    if (!url) {
      setImgError(true);
      setImgLoading(false);
      return;
    }

    if (isImage) {
      setImgLoading(true);
      setImgError(false);
      try {
        const blobUrl = getBlobUrlFromDataUrl(url);
        setImgSrc(blobUrl || url);
      } catch (e) {
        console.warn("Failed to resolve image blob URL, using raw URL:", e);
        setImgSrc(url);
      }
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setPdfDoc(null);
    setPageNum(1);

    const getPdfData = async (dataOrUrl: string): Promise<Uint8Array | string> => {
      if (!dataOrUrl) return dataOrUrl;

      if (dataOrUrl.startsWith('data:')) {
        const base64 = dataOrUrl.split(',')[1] || '';
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }

      if (dataOrUrl.startsWith('JVBERi0')) {
        const binaryString = atob(dataOrUrl);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }

      // Fetch arrayBuffer for relative or HTTP URLs to attach auth token
      if (dataOrUrl.startsWith('/') || dataOrUrl.startsWith('http')) {
        try {
          const token = localStorage.getItem('admin_token') || localStorage.getItem('token') || sessionStorage.getItem('admin_token');
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          
          const response = await fetch(dataOrUrl, { headers });
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            return new Uint8Array(buffer);
          }
        } catch (e) {
          console.warn('getPdfData fetch fallback error:', e);
        }
      }

      return dataOrUrl;
    };

    const loadPdf = async () => {
      try {
        const sourceData = await getPdfData(url);
        const loadingTask = pdfjsLib.getDocument({
          data: typeof sourceData !== 'string' ? sourceData : undefined,
          url: typeof sourceData === 'string' ? sourceData : undefined,
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setLoading(false);
        }
      } catch (err: any) {
        console.warn('PdfViewer PDF load error:', err);
        if (isMounted) {
          // If PDF loading fails, try to load it as an image FIRST before showing error
          // This handles cases where an image was uploaded but named/flagged as a PDF
          try {
            let blobUrl = getBlobUrlFromDataUrl(url);
            if (!blobUrl && (url.startsWith('/') || url.startsWith('http'))) {
              const token = localStorage.getItem('admin_token') || localStorage.getItem('token') || sessionStorage.getItem('admin_token');
              const headers: Record<string, string> = {};
              if (token) headers['Authorization'] = `Bearer ${token}`;
              const resp = await fetch(url, { headers });
              if (resp.ok) {
                const blob = await resp.blob();
                blobUrl = URL.createObjectURL(blob);
              }
            }
            setImgSrc(blobUrl || url);
            setImgLoading(true);
            setImgError(false);
            setForceImageMode(true);
            setLoading(false);
          } catch (e) {
            console.error('Image fallback failed after PDF error:', e);
            setError('Gagal memuat pratinjau. File mungkin rusak atau format tidak didukung.');
            setLoading(false);
          }
        }
      }
    };

    if (url) {
      loadPdf();
    } else {
      setError('URL Dokumen kosong');
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [url, isImage]);

  // Render current PDF page
  useEffect(() => {
    if (isImage || !pdfDoc || !canvasRef.current) return;

    let renderTask: pdfjsLib.RenderTask | null = null;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const viewport = page.getViewport({ scale: scale * 1.2, rotation });
        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Fill white background to prevent transparent canvas rendering issues
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const transform = pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : null;

        renderTask = page.render({
          canvasContext: ctx,
          viewport,
          transform: transform || undefined,
        });

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
      }
    };

    renderPage();

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNum, scale, rotation, isImage]);

  const handlePrevPage = () => {
    if (pageNum > 1) setPageNum(pageNum - 1);
  };

  const handleNextPage = () => {
    if (pageNum < numPages) setPageNum(pageNum + 1);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.4));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1.0);
    setRotation(0);
  };

  if (isImage) {
    return (
      <div className={`flex flex-col h-full w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 ${className}`}>
        {/* Control Bar */}
        <div className="bg-slate-800/90 backdrop-blur-md px-4 py-2.5 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-slate-200 text-xs shrink-0 select-none z-10">
          <div className="flex items-center gap-2 truncate max-w-[200px] sm:max-w-xs">
            <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-slate-100 truncate">{title}</span>
          </div>

          {/* Zoom & Rotation Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors"
              title="Perkecil (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-[11px] text-slate-400 px-1 min-w-[36px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors"
              title="Perbesar (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-4 w-[1px] bg-slate-700 mx-1" />
            <button
              onClick={handleRotate}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors"
              title="Putar Gambar"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors"
              title="Reset Zoom & Rotasi"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Viewport */}
        <div className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-4 min-h-[400px] relative">
          {imgLoading && !imgError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-3 bg-slate-950/80 z-20">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
              <p className="text-xs font-semibold tracking-wider text-slate-300 uppercase">MEMUAT GAMBAR DOKUMEN...</p>
            </div>
          )}

          {imgError ? (
            <div className="flex flex-col items-center justify-center text-center p-8 max-w-md space-y-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl z-20">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm uppercase tracking-wide">{title}</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Gagal memuat pratinjau gambar. File mungkin dalam jalur server yang berbeda atau belum diunggah secara sempurna.</p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => downloadFile(url, `${title.replace(/\s+/g, '_')}.png`)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Unduh Berkas
                </button>
                <button
                  onClick={() => openDataUrlInNewTab(url, title)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" /> Buka Tab Baru
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center max-w-full max-h-full transition-transform duration-150 ease-out p-4">
              <img 
                src={imgSrc} 
                alt={title} 
                onLoad={() => setImgLoading(false)}
                onError={() => {
                  setImgLoading(false);
                  if (imgSrc !== url) {
                    setImgSrc(url);
                  } else {
                    setImgError(true);
                  }
                }}
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out'
                }}
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-slate-800 bg-white"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 ${className}`}>
      {/* Control Bar */}
      <div className="bg-slate-800/90 backdrop-blur-md px-4 py-2.5 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-slate-200 text-xs shrink-0 select-none z-10">
        {/* Title */}
        <div className="flex items-center gap-2 truncate max-w-[200px] sm:max-w-xs">
          <FileText className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold text-slate-100 truncate">{title}</span>
        </div>

        {/* Page Navigation */}
        {numPages > 0 && (
          <div className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <button
              onClick={handlePrevPage}
              disabled={pageNum <= 1}
              className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-[11px] px-1 text-slate-300">
              {pageNum} / {numPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={pageNum >= numPages}
              className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Zoom & Rotation Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors"
            title="Perkecil (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-[11px] text-slate-400 px-1 min-w-[36px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors"
            title="Perbesar (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-4 w-[1px] bg-slate-700 mx-1" />
          <button
            onClick={handleRotate}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors"
            title="Putar Dokumen"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition-colors"
            title="Reset Zoom & Rotasi"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Viewport */}
      <div className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-4 min-h-[400px] scrollbar-thin scrollbar-thumb-slate-700">
        {loading && (
          <div className="flex flex-col items-center justify-center text-slate-400 space-y-3 p-8">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
            <p className="text-xs font-semibold tracking-wider text-slate-300 uppercase">MEMUAT PRATINJAU DOKUMEN...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-md space-y-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm uppercase tracking-wide">{title}</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{error}</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => downloadFile(url, `${title.replace(/\s+/g, '_')}.pdf`)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Download className="w-4 h-4" /> Unduh PDF
              </button>
              <button
                onClick={() => openDataUrlInNewTab(url, title)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" /> Buka Tab Baru
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-white my-auto">
            <canvas ref={canvasRef} className="block mx-auto max-w-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
