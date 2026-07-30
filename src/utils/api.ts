import { auth } from '../lib/firebase';

const API_BASE_URL = '/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const adminToken = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') || localStorage.getItem('adminToken');
  const storedToken = localStorage.getItem('jamaah_token') || localStorage.getItem('mitra_token') || adminToken || localStorage.getItem('token');
  const user = auth.currentUser;
  let token: string | null = null;

  const isAdminCall = endpoint.startsWith('/admin') || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  if (isAdminCall && adminToken) {
    token = adminToken;
  } else if (user) {
    try {
      token = await user.getIdToken();
    } catch (e) {
      console.warn('Failed to get Firebase token:', e);
    }
  }

  if (!token) {
    token = storedToken;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getPackages: () => fetchApi('/packages'),
  
  // Jamaah Endpoints
  uploadPayment: (data: { registrationId: string; paymentType: string; amount: string; proofUrl: string }) => 
    fetchApi('/payments', { method: 'POST', body: JSON.stringify(data) }),
  
  // Admin Endpoints
  getPendingVerifications: () => fetchApi('/admin/pending-verifications'),
  getAdminDashboardStats: () => fetchApi('/admin/dashboard-stats'),
  getPendingDocuments: () => fetchApi('/admin/pending-documents'),
  verifyDocument: (id: string, status: 'approved' | 'rejected', reason?: string) => 
    fetchApi(`/admin/documents/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),
  getFinancialReport: () => fetchApi('/admin/financial-report'),
  
  // Jamaah Endpoints
  getJamaahDashboardInfo: () => fetchApi('/jamaah/dashboard-info'),
  getJamaahDocuments: () => fetchApi('/jamaah/documents'),
  getJamaahInvoice: () => fetchApi('/jamaah/invoice'),
  uploadDocument: (data: { docType: string, fileUrl: string }) => 
    fetchApi('/documents/upload', { method: 'POST', body: JSON.stringify(data) }),
  
  verifyPayment: (id: string, status: 'approved' | 'rejected', reason?: string) => 
    fetchApi(`/admin/payments/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),
};
