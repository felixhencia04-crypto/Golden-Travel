export const openDataUrlInNewTab = (dataUrl: string | undefined | null) => {
  if (!dataUrl || typeof dataUrl !== 'string') {
    console.warn('openDataUrlInNewTab: Invalid or empty dataUrl provided');
    return;
  }
  
  try {
    if (dataUrl.startsWith('http')) {
      window.open(dataUrl, '_blank');
      return;
    }

    if (!dataUrl.includes(',')) {
      window.open(dataUrl, '_blank');
      return;
    }

    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    
    if (!mimeMatch || !arr[1]) {
       window.open(dataUrl, '_blank');
       return;
    }

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], {type: mime});
    const url = URL.createObjectURL(blob);
    
    const newWindow = window.open(url, '_blank');
    if (!newWindow) {
      window.location.href = url;
    }
    
    setTimeout(() => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }, 10000);
  } catch (e) {
    console.error('openDataUrlInNewTab error:', e);
    try {
      window.open(dataUrl, '_blank');
    } catch (innerErr) {
      console.error('openDataUrlInNewTab final fallback failed:', innerErr);
    }
  }
};

export const downloadFile = (dataUrl: string | undefined | null, defaultFilename: string = 'Sertifikat.pdf') => {
  if (!dataUrl || typeof dataUrl !== 'string') {
    console.warn('downloadFile: Invalid dataUrl');
    return;
  }

  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error('downloadFile error:', e);
    openDataUrlInNewTab(dataUrl);
  }
};

