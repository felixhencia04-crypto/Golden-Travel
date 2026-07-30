import { getAuth } from 'firebase/auth';

const API_BASE_URL = '/api';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jamaah_token') ||
         localStorage.getItem('mitra_token') ||
         localStorage.getItem('admin_token') ||
         sessionStorage.getItem('admin_token');
}

export function getAdminToken(): string | null {
  return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
}

async function getHeaders(endpoint: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const storedToken = getStoredToken();
  const isAdminPath = endpoint.startsWith('/admin') || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  if (isAdminPath && storedToken) {
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
      // Fallback to stored token if getIdToken fails
    }
  }

  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }

  return headers;
}

export const api = {
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
