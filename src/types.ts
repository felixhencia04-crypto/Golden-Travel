export interface Package {
  id: string;
  name: string;
  description: string[];
  price: number;
  duration: string;
  features: string[];
  image: string;
  type?: 'umroh' | 'haji';
  itinerary?: { day: string; title: string; description: string }[];
  isAvailable?: boolean;
  scheduleUrl?: string;
  quota?: number;
  departureDate?: string;
  muthawwifName?: string;
  muthawwifRole?: string;
  muthawwifPhone?: string;
  muthawwifAvatarUrl?: string;
  muthawwifNotes?: string;
}

export interface Schedule {
  id: string;
  packageId: string;
  departureDate: string;
  itineraryPdfUrl: string;
  availableSeats: number;
  totalSeats: number;
  days?: string;
  packageName?: string;
  package?: Package;
  name?: string;
  airline?: string;
  muthawwifName?: string;
  muthawwifRole?: string;
  muthawwifPhone?: string;
  muthawwifAvatarUrl?: string;
  muthawwifNotes?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'info' | 'important' | 'update';
}

export interface InventoryStatus {
  jamaahId: string;
  items: {
    koper: boolean;
    ihram: boolean;
    mukena: boolean;
  };
  lastUpdated: string;
  assignee: string;
}

export interface Consultation {
  id: string;
  packageId?: string;
  packageName: string;
  name: string;
  phone: string;
  email?: string;
  accountEmail?: string;
  password?: string;
  avatarUrl?: string;
  message: string;
  status: 'new' | 'followed_up' | 'payment' | 'document' | 'verified' | 'registered' | 'departed';
  createdAt?: string;
  date?: string; // from mock data
  paymentProofUrl?: string;
  paymentStep?: 'none' | 'dp1' | 'dp2' | 'lunas';
  pendingPaymentStep?: 'none' | 'dp1' | 'dp2' | 'lunas';
  documents?: Record<string, string>;
  documentStatuses?: Record<string, 'pending' | 'approved' | 'rejected'>;
  documentRejectionNotes?: Record<string, string>;
  bookingId?: string;
  paxCount?: number;
  paxData?: Record<string, any>[];
  transactions?: {
    id: string;
    amount: number;
    date: string;
    proofUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    createdAt: string;
  }[];
}

export type RegistrationStatus = 
  | 'DRAFT'
  | 'PILIH_PAKET'
  | 'ISI_BIODATA'
  | 'UPLOAD_DOKUMEN'
  | 'VERIFIKASI_DOKUMEN'
  | 'CICIL_BAYAR'
  | 'VERIFIKASI_BAYAR'
  | 'LUNAS'
  | 'SIAP_BERANGKAT'
  | 'BERANGKAT'
  | 'SELESAI'
  | 'CANCELLED';

export interface Registration {
  id: string;
  userId: string;
  packageId: string;
  scheduleId?: string;
  status: RegistrationStatus;
  totalAmount: number;
  paxData?: any[];
  package?: Package;
  createdAt: string;
  updatedAt: string;
  ordererName?: string;
  ordererPhone?: string;
  ordererEmail?: string;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'mitra' | 'jamaah';
  email: string;
  status: RegistrationStatus;
  phone?: string;
  avatarUrl?: string;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: string;
}

export interface HelpTicket {
  id: string;
  jamaahId: string;
  jamaahName: string;
  subject: string;
  message: string;
  status: 'open' | 'closed';
  createdAt: string;
  replies: {
    id: string;
    sender: 'jamaah' | 'admin';
    message: string;
    createdAt: string;
  }[];
}

export interface TripMemory {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  type: 'photo' | 'video';
  date: string;
}

export interface CRMRegistration extends Registration {
  user: User;
  package: Package;
  schedule?: Schedule;
  paymentProgress: number;
  hasRequiredDocs: boolean;
  manifests?: any[];
}

export interface Activity {
  id: string;
  registrationId: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
  user?: User;
}
