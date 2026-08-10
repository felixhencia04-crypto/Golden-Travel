import { toast } from 'sonner';

export const sanitizeFileUrl = (dataUrl: string | undefined | null): string => {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  let url = dataUrl.trim();
  // Strip http://localhost:3000 or http://127.0.0.1:3000 or https://localhost:3000
  url = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
  return url;
};

export const isPdfUrl = (url: string | undefined | null): boolean => {
  const clean = sanitizeFileUrl(url);
  if (!clean) return false;
  if (clean.startsWith('data:application/pdf')) return true;
  if (clean.startsWith('data:application/octet-stream') && clean.includes('JVBERi0')) return true;
  if (clean.startsWith('JVBERi0')) return true;
  const lower = clean.toLowerCase();
  if (lower.includes('.pdf') || lower.includes('ext=.pdf') || lower.includes('ext=pdf') || lower.includes('/file.pdf') || lower.includes('format=pdf')) return true;
  return false;
};

export const isImageUrl = (url: string | undefined | null): boolean => {
  const clean = sanitizeFileUrl(url);
  if (!clean) return false;
  // If it's a PDF, it is NEVER an image
  if (isPdfUrl(clean)) return false;

  if (clean.startsWith('data:image/')) return true;
  if (clean.startsWith('iVBORw0KG') || clean.startsWith('/9j/')) return true;
  const lower = clean.toLowerCase();
  if (lower.includes('.png') || lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.webp') || lower.includes('.gif') || lower.includes('ext=.png') || lower.includes('ext=.jpg') || lower.includes('ext=.jpeg')) return true;
  
  // Fallback for relative data/http/api paths that are NOT PDFs
  if (!isPdfUrl(clean) && (clean.startsWith('data:') || clean.startsWith('http') || clean.startsWith('/'))) {
    return true;
  }
  return false;
};

export const convertSvgToPngBlob = (svgUrl: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 856;
      canvas.height = img.naturalHeight || 540;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to Blob failed'));
        }, 'image/png');
      } else {
        reject(new Error('Canvas context null'));
      }
    };
    img.onerror = (err) => reject(err);
    img.src = svgUrl;
  });
};

export const getBlobUrlFromDataUrl = (dataUrl: string | undefined | null): string => {
  const clean = sanitizeFileUrl(dataUrl);
  if (!clean) return '';
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('blob:') || clean.startsWith('/')) return clean;
  if (clean.startsWith('data:image/svg+xml')) return clean;

  let fullDataUrl = clean;
  if (!clean.startsWith('data:')) {
    if (clean.startsWith('JVBERi0')) {
      fullDataUrl = `data:application/pdf;base64,${clean}`;
    } else if (clean.startsWith('iVBORw0KG')) {
      fullDataUrl = `data:image/png;base64,${clean}`;
    } else if (clean.startsWith('/9j/')) {
      fullDataUrl = `data:image/jpeg;base64,${clean}`;
    } else {
      fullDataUrl = `data:image/png;base64,${clean}`;
    }
  }

  try {
    const arr = fullDataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const isBase64 = arr[0].includes(';base64');
    
    if (!isBase64) {
      return fullDataUrl;
    }

    const base64Str = arr[1] || '';
    const bstr = atob(base64Str);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error('getBlobUrlFromDataUrl error:', e);
    return fullDataUrl;
  }
};

export const openDataUrlInNewTab = (dataUrl: string | undefined | null, title: string = 'Dokumen') => {
  if (!dataUrl || typeof dataUrl !== 'string') {
    console.warn('openDataUrlInNewTab: Invalid or empty dataUrl provided');
    return;
  }

  const cleanUrl = sanitizeFileUrl(dataUrl);
  if (!cleanUrl) return;

  try {
    const safeTitle = title.replace(/["'<>&]/g, '');

    // Process relative URLs (/uploads/...), data URLs or base64 strings
    let mime = 'application/pdf';
    let fullDataUrl = cleanUrl;

    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      fullDataUrl = cleanUrl;
      mime = isPdfUrl(cleanUrl) ? 'application/pdf' : isImageUrl(cleanUrl) ? 'image/png' : 'application/pdf';
    } else if (cleanUrl.startsWith('data:')) {
      fullDataUrl = cleanUrl;
      const arr = cleanUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (mimeMatch) mime = mimeMatch[1];
    } else if (cleanUrl.startsWith('/')) {
      mime = isPdfUrl(cleanUrl) ? 'application/pdf' : isImageUrl(cleanUrl) ? 'image/png' : 'application/pdf';
      fullDataUrl = `${window.location.origin}${cleanUrl}`;
    } else if (cleanUrl.startsWith('iVBORw0KG')) {
      mime = 'image/png';
      fullDataUrl = `data:image/png;base64,${cleanUrl}`;
    } else if (cleanUrl.startsWith('/9j/')) {
      mime = 'image/jpeg';
      fullDataUrl = `data:image/jpeg;base64,${cleanUrl}`;
    } else if (cleanUrl.startsWith('JVBERi0')) {
      mime = 'application/pdf';
      fullDataUrl = `data:application/pdf;base64,${cleanUrl}`;
    } else {
      const isImg = isImageUrl(cleanUrl);
      mime = isImg ? 'image/png' : 'application/pdf';
      fullDataUrl = `data:${mime};base64,${cleanUrl}`;
    }

    const isPdf = mime.includes('pdf') || isPdfUrl(cleanUrl);

    // Open clean window on same origin
    const newWin = window.open('', '_blank');
    if (!newWin) {
      downloadFile(cleanUrl, `${safeTitle}.${isPdf ? 'pdf' : 'png'}`);
      return;
    }

    const iconStr = isPdf ? '📄' : '🖼️';

    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="${window.location.origin}/">
  <title>${safeTitle}</title>
  <style>
    * { box-sizing: border-box; }
    body, html { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; background: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #f8fafc; }
    .header { height: 56px; background: #1e293b; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-bottom: 1px solid #334155; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); z-index: 20; position: relative; }
    .header .title-box { display: flex; align-items: center; gap: 10px; overflow: hidden; max-width: 45%; }
    .header h1 { font-size: 15px; font-weight: 800; margin: 0; color: #f8fafc; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .header .controls { display: flex; align-items: center; gap: 8px; }
    .btn-icon { background: #334155; color: #f8fafc; border: 1px solid #475569; width: 34px; height: 34px; border-radius: 8px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
    .btn-icon:hover { background: #475569; border-color: #64748b; }
    .btn { background: #f59e0b; color: #0f172a; padding: 8px 18px; border-radius: 10px; font-weight: 800; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; border: none; transition: background 0.2s, transform 0.1s; }
    .btn:hover { background: #d97706; transform: translateY(-1px); }
    .container { height: calc(100% - 56px); width: 100%; display: flex; align-items: center; justify-content: center; background: #090d16; position: relative; overflow: auto; padding: 20px; }
    object, embed, iframe { width: 100%; height: 100%; border: none; }
    .img-wrapper { display: flex; align-items: center; justify-content: center; transition: transform 0.15s ease-out; }
    img { max-width: 90vw; max-height: 85vh; object-fit: contain; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); border: 1px solid #334155; background: #ffffff; }
    .error-box { text-align: center; padding: 40px 24px; max-width: 480px; background: #1e293b; border-radius: 20px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4); }
    .error-box h3 { font-size: 16px; font-weight: 800; color: #f8fafc; margin: 0 0 8px 0; }
    .error-box p { font-size: 13px; color: #94a3b8; margin: 0 0 20px 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-box">
      <span style="font-size:18px;">${iconStr}</span>
      <h1>${safeTitle}</h1>
    </div>
    <div class="controls">
      ${!isPdf ? `
        <button id="zoomOutBtn" class="btn-icon" title="Perkecil (-)">➖</button>
        <span id="zoomLabel" style="font-family:monospace; font-size:11px; color:#94a3b8; min-width:40px; text-align:center;">100%</span>
        <button id="zoomInBtn" class="btn-icon" title="Perbesar (+)">➕</button>
        <button id="rotateBtn" class="btn-icon" title="Putar Gambar">🔄</button>
        <button id="resetBtn" class="btn-icon" title="Reset">⏮️</button>
        <div style="width:1px; height:20px; background:#334155; margin:0 4px;"></div>
      ` : ''}
      <button id="downloadBtn" class="btn">⬇️ Unduh Berkas</button>
    </div>
  </div>
  <div class="container" id="mainContainer">
    ${
      isPdf
        ? `<object data="${fullDataUrl}" type="application/pdf" width="100%" height="100%">
            <iframe src="${fullDataUrl}" width="100%" height="100%">
              <div style="text-align:center; padding:40px;">
                <p style="font-size:18px; font-weight:bold;">${safeTitle}</p>
                <p style="color:#cbd5e1; font-size:14px; margin-bottom:20px;">Klik tombol di bawah jika pratinjau tidak otomatis tampil.</p>
                <button id="fallbackBtn" class="btn">Unduh Dokumen PDF</button>
              </div>
            </iframe>
           </object>`
        : `<div class="img-wrapper" id="imgWrapper">
             <img id="mainImg" src="${fullDataUrl}" alt="${safeTitle}" />
           </div>`
    }
  </div>
  <script>
    let scale = 1.0;
    let rotation = 0;

    function updateTransform() {
      const wrapper = document.getElementById('imgWrapper');
      const label = document.getElementById('zoomLabel');
      if (wrapper) {
        wrapper.style.transform = "scale(" + scale + ") rotate(" + rotation + "deg)";
      }
      if (label) {
        label.textContent = Math.round(scale * 100) + "%";
      }
    }

    const zoomInBtn = document.getElementById('zoomInBtn');
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', function() {
        scale = Math.min(scale + 0.25, 3.0);
        updateTransform();
      });
    }

    const zoomOutBtn = document.getElementById('zoomOutBtn');
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', function() {
        scale = Math.max(scale - 0.25, 0.4);
        updateTransform();
      });
    }

    const rotateBtn = document.getElementById('rotateBtn');
    if (rotateBtn) {
      rotateBtn.addEventListener('click', function() {
        rotation = (rotation + 90) % 360;
        updateTransform();
      });
    }

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        scale = 1.0;
        rotation = 0;
        updateTransform();
      });
    }

    function triggerDownload() {
      const a = document.createElement('a');
      a.href = "${fullDataUrl}";
      a.download = "${safeTitle.replace(/\s+/g, '_')}.${isPdf ? 'pdf' : 'png'}";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    document.getElementById('downloadBtn').addEventListener('click', triggerDownload);
    const fallbackBtn = document.getElementById('fallbackBtn');
    if (fallbackBtn) fallbackBtn.addEventListener('click', triggerDownload);

    const mainImg = document.getElementById('mainImg');
    if (mainImg) {
      mainImg.onerror = function() {
        const container = document.getElementById('mainContainer');
        if (container) {
          container.innerHTML = \`
            <div class="error-box">
              <div style="font-size:36px; margin-bottom:12px;">⚠️</div>
              <h3>Pratinjau Gambar Tidak Tersedia</h3>
              <p>Gambar dokumen ini belum diunggah secara lengkap atau memerlukan otentikasi. Silakan klik tombol di bawah untuk mengunduh berkas langsung.</p>
              <button id="errDownloadBtn" class="btn">⬇️ Unduh Berkas</button>
            </div>
          \`;
          document.getElementById('errDownloadBtn').addEventListener('click', triggerDownload);
        }
      };
    }
  </script>
</body>
</html>`;

    newWin.document.open();
    newWin.document.write(htmlContent);
    newWin.document.close();
  } catch (e) {
    console.error('openDataUrlInNewTab error:', e);
    downloadFile(dataUrl, `${title}.pdf`);
  }
};

export const downloadFile = async (dataUrl: string | undefined | null, defaultFilename: string = 'Dokumen.pdf') => {
  if (!dataUrl || typeof dataUrl !== 'string') {
    toast.error('Gagal mengunduh: URL file tidak valid');
    return;
  }

  const cleanUrl = sanitizeFileUrl(dataUrl);
  if (!cleanUrl) {
    toast.error('Gagal mengunduh: URL file kosong');
    return;
  }

  try {
    let finalFilename = defaultFilename.trim();
    let downloadUrl = cleanUrl;
    let createdBlobUrl = false;

    if (cleanUrl.startsWith('data:')) {
      const arr = cleanUrl.split(',');
      const isBase64 = arr[0].includes(';base64');
      const mimeMatch = arr[0].match(/:(.*?);/);
      let mime = mimeMatch ? mimeMatch[1] : 'application/pdf';

      if (cleanUrl.includes('data:image/svg+xml')) {
        try {
          const blob = await convertSvgToPngBlob(cleanUrl);
          downloadUrl = URL.createObjectURL(blob);
          createdBlobUrl = true;
          if (!finalFilename.toLowerCase().endsWith('.png')) {
            finalFilename = finalFilename.replace(/\.[^/.]+$/, '') + '.png';
          }
        } catch (svgErr) {
          console.warn('SVG to PNG conversion failed, falling back to raw SVG:', svgErr);
          const rawSvg = decodeURIComponent(arr[1] || '');
          const blob = new Blob([rawSvg], { type: 'image/svg+xml;charset=utf-8' });
          downloadUrl = URL.createObjectURL(blob);
          createdBlobUrl = true;
          if (!finalFilename.toLowerCase().endsWith('.svg')) {
            finalFilename = finalFilename.replace(/\.[^/.]+$/, '') + '.svg';
          }
        }
      } else if (isBase64) {
        const isPdfData = cleanUrl.includes('data:application/pdf') || cleanUrl.includes('JVBERi0');
        if (isPdfData) {
          mime = 'application/pdf';
          if (!finalFilename.toLowerCase().endsWith('.pdf')) {
            finalFilename = finalFilename.replace(/\.[^/.]+$/, '') + '.pdf';
          }
        } else if (cleanUrl.includes('data:image/png')) {
          mime = 'image/png';
          if (!finalFilename.toLowerCase().endsWith('.png')) {
            finalFilename = finalFilename.replace(/\.[^/.]+$/, '') + '.png';
          }
        } else if (cleanUrl.includes('data:image/jpeg') || cleanUrl.includes('data:image/jpg')) {
          mime = 'image/jpeg';
          if (!finalFilename.toLowerCase().endsWith('.jpg') && !finalFilename.toLowerCase().endsWith('.jpeg')) {
            finalFilename = finalFilename.replace(/\.[^/.]+$/, '') + '.jpg';
          }
        }
        const bstr = atob(arr[1] || '');
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        downloadUrl = URL.createObjectURL(blob);
        createdBlobUrl = true;
      } else {
        const textData = decodeURIComponent(arr[1] || '');
        const blob = new Blob([textData], { type: mime });
        downloadUrl = URL.createObjectURL(blob);
        createdBlobUrl = true;
      }
    } else if (cleanUrl.startsWith('/') || cleanUrl.startsWith('http')) {
      try {
        const token = localStorage.getItem('admin_token') || localStorage.getItem('token') || sessionStorage.getItem('admin_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(cleanUrl, { headers });
        if (!response.ok) {
          toast.error(`Gagal mengunduh berkas (HTTP ${response.status}). File tidak ditemukan di server.`);
          return;
        }

        const blob = await response.blob();
        let mime = blob.type || response.headers.get('content-type') || '';

        // If response is HTML error page or JSON error, DO NOT download corrupted file
        if (mime.includes('text/html') || mime.includes('application/json')) {
          toast.error('Gagal mengunduh berkas: Respon server berupa HTML/JSON error, bukan dokumen valid.');
          return;
        }

        // Determine MIME & extension accurately from server response or URL
        if (mime.includes('image/svg+xml') || cleanUrl.toLowerCase().includes('.svg')) {
          mime = 'image/svg+xml';
          if (!finalFilename.toLowerCase().endsWith('.svg') && !finalFilename.toLowerCase().endsWith('.png')) {
            finalFilename = finalFilename.replace(/\.[^/.]+$/, '') + '.svg';
          }
        } else if (mime.includes('pdf') || cleanUrl.toLowerCase().includes('.pdf')) {
          mime = 'application/pdf';
          if (!finalFilename.toLowerCase().endsWith('.pdf')) {
            finalFilename = finalFilename.replace(/\.[^/.]+$/, '') + '.pdf';
          }
        } else if (mime.includes('image/png') || cleanUrl.toLowerCase().includes('.png')) {
          mime = 'image/png';
          if (!finalFilename.toLowerCase().endsWith('.png')) {
            finalFilename = finalFilename.replace(/\.[^/.]+$/, '') + '.png';
          }
        } else if (mime.includes('image/jpeg') || cleanUrl.toLowerCase().includes('.jpg') || cleanUrl.toLowerCase().includes('.jpeg')) {
          mime = 'image/jpeg';
          if (!finalFilename.toLowerCase().endsWith('.jpg') && !finalFilename.toLowerCase().endsWith('.jpeg')) {
            finalFilename = finalFilename.replace(/\.[^/.]+$/, '') + '.jpg';
          }
        }

        const typedBlob = new Blob([blob], { type: mime || 'application/octet-stream' });
        downloadUrl = URL.createObjectURL(typedBlob);
        createdBlobUrl = true;
      } catch (err: any) {
        console.error('downloadFile blob fetch error:', err);
        toast.error('Gagal mengunduh berkas: ' + (err?.message || 'Koneksi bermasalah'));
        return;
      }
    }

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (createdBlobUrl) {
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
    }
  } catch (e: any) {
    console.error('downloadFile error:', e);
    toast.error('Gagal memproses file unduhan');
  }
};
