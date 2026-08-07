import { getAuth } from 'firebase/auth';

const API_BASE_URL = '/api';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  if (path.startsWith('/admin')) {
    return getAdminToken() ||
           localStorage.getItem('jamaah_token') ||
           localStorage.getItem('mitra_token');
  }
  if (path.startsWith('/mitra')) {
    return localStorage.getItem('mitra_token') ||
           localStorage.getItem('jamaah_token') ||
           localStorage.getItem('admin_token');
  }
  return localStorage.getItem('jamaah_token') ||
         localStorage.getItem('mitra_token') ||
         localStorage.getItem('admin_token') ||
         sessionStorage.getItem('admin_token');
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
}

async function getHeaders(endpoint: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const isAdminCall = endpoint.includes('/admin') || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));
  const isMitraCall = endpoint.includes('/mitra') || (typeof window !== 'undefined' && window.location.pathname.startsWith('/mitra'));

  let storedToken: string | null = null;
  if (isAdminCall) {
    storedToken = getAdminToken() || getStoredToken();
  } else if (isMitraCall) {
    storedToken = localStorage.getItem('mitra_token') || getStoredToken();
  } else {
    storedToken = getStoredToken();
  }

  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
    return headers;
  }

  const auth = getAuth();
  const user = auth.currentUser;
  
  if (user && !endpoint.includes('/admin/login')) {
    try {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
      return headers;
    } catch (e) {
      // Fallback
    }
  }

  return headers;
}

function formatEndpointUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
  if (endpoint.startsWith('/api/')) return endpoint;
  if (endpoint.startsWith('api/')) return '/' + endpoint;
  return `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
}

export const api = {
  async get(endpoint: string) {
    const response = await fetch(formatEndpointUrl(endpoint), {
      headers: await getHeaders(endpoint),
    });
    if (!response.ok) {
      let errText = await response.text();
      try { 
        errText = JSON.parse(errText).error || errText; 
      } catch(e) {
        if (errText.includes('<html')) {
          if (response.status === 403) errText = 'Akses ditolak (Forbidden).';
          else errText = `Terjadi kesalahan pada server (${response.status}).`;
        }
      }
      throw new Error(errText);
    }
    return response.json();
  },
  async post(endpoint: string, data: any) {
    const response = await fetch(formatEndpointUrl(endpoint), {
      method: 'POST',
      headers: await getHeaders(endpoint),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let errText = await response.text();
      try { 
        errText = JSON.parse(errText).error || errText; 
      } catch(e) {
        if (errText.includes('<html')) {
          if (response.status === 403) errText = 'Akses ditolak (Forbidden).';
          else errText = `Terjadi kesalahan pada server (${response.status}).`;
        }
      }
      throw new Error(errText);
    }
    return response.json();
  },
  async put(endpoint: string, data: any) {
    const response = await fetch(formatEndpointUrl(endpoint), {
      method: 'PUT',
      headers: await getHeaders(endpoint),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let errText = await response.text();
      try { 
        errText = JSON.parse(errText).error || errText; 
      } catch(e) {
        if (errText.includes('<html')) {
          if (response.status === 403) errText = 'Akses ditolak (Forbidden).';
          else errText = `Terjadi kesalahan pada server (${response.status}).`;
        }
      }
      throw new Error(errText);
    }
    return response.json();
  },
  async patch(endpoint: string, data: any) {
    const response = await fetch(formatEndpointUrl(endpoint), {
      method: 'PATCH',
      headers: await getHeaders(endpoint),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let errText = await response.text();
      try { 
        errText = JSON.parse(errText).error || errText; 
      } catch(e) {
        if (errText.includes('<html')) {
          if (response.status === 403) errText = 'Akses ditolak (Forbidden).';
          else errText = `Terjadi kesalahan pada server (${response.status}).`;
        }
      }
      throw new Error(errText);
    }
    return response.json();
  },
  async delete(endpoint: string) {
    const response = await fetch(formatEndpointUrl(endpoint), {
      method: 'DELETE',
      headers: await getHeaders(endpoint),
    });
    if (!response.ok) {
      let errText = await response.text();
      try { 
        errText = JSON.parse(errText).error || errText; 
      } catch(e) {
        if (errText.includes('<html')) {
          if (response.status === 403) errText = 'Akses ditolak (Forbidden).';
          else errText = `Terjadi kesalahan pada server (${response.status}).`;
        }
      }
      throw new Error(errText);
    }
    return response.json();
  },
  async download(endpoint: string) {
    const response = await fetch(formatEndpointUrl(endpoint), {
      headers: await getHeaders(endpoint),
    });
    if (!response.ok) {
      let errText = await response.text();
      try { 
        errText = JSON.parse(errText).error || errText; 
      } catch(e) {
        if (errText.includes('<html')) {
          if (response.status === 403) errText = 'Akses ditolak (Forbidden).';
          else errText = `Terjadi kesalahan pada server (${response.status}).`;
        }
      }
      throw new Error(errText);
    }
    return response.blob();
  },
  async upload(endpoint: string, file: File, otherData: any = {}) {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(otherData).forEach(key => {
      formData.append(key, otherData[key]);
    });

    const headers = await getHeaders(endpoint);
    // Delete content-type to let browser set it with boundary
    delete (headers as any)['Content-Type'];

    const response = await fetch(formatEndpointUrl(endpoint), {
      method: 'POST',
      headers: headers as any,
      body: formData,
    });
    
    if (!response.ok) {
      let errText = await response.text();
      try { errText = JSON.parse(errText).error || errText; } catch(e) {}
      throw new Error(errText);
    }
    return response.json();
  },
};
