import { getAuth } from 'firebase/auth';

const API_BASE_URL = '/api';

async function getHeaders(endpoint: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const adminToken = localStorage.getItem('admin_token');
  if (endpoint.startsWith('/admin') && adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
    return headers;
  }

  const auth = getAuth();
  const user = auth.currentUser;
  
  if (user && !endpoint.includes('/admin/login')) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
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
};
