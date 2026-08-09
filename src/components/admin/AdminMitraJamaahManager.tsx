import React, { useState, useEffect, useMemo } from 'react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Users, Wallet, Luggage, FileText, CheckCircle2, Clock, 
  AlertCircle, Download, Upload, Search, Filter, Eye, Edit2, 
  Save, Trash2, Check, X, Building2, Plane, Scroll, QrCode, ArrowLeft,
  ShieldCheck, MessageCircle, ChevronDown, User, Sparkles, Phone, Mail, MapPin, Tag, Activity, HeartPulse,
  LayoutDashboard, FileSearch, UserCheck, Edit3, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { api } from '../../lib/api';
import { generateRegistrationFormPdf } from '../../utils/generateRegistrationFormPdf';
import { generateManifestPdf } from '../../utils/generateManifestPdf';
import ConfirmModal from '../ui/ConfirmModal';

interface AdminMitraJamaahManagerProps {
  activeSubTab?: 'biodata' | 'dokumen' | 'pembayaran' | 'persiapan' | 'dokumen_keberangkatan';
  onRefresh?: () => void;
}

export default function AdminMitraJamaahManager({ activeSubTab = 'biodata', onRefresh }: AdminMitraJamaahManagerProps) {
  const [currentTab, setCurrentTab] = useState<'biodata' | 'dokumen' | 'pembayaran' | 'persiapan' | 'dokumen_keberangkatan'>(activeSubTab);
  const [selectedMitraFilter, setSelectedMitraFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJamaahForDetail, setSelectedJamaahForDetail] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('dashboard');
  const [realMitraList, setRealMitraList] = useState<any[]>([]);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => {}
  });

  // Equipment filters
  const [equipmentStatusFilter, setEquipmentStatusFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [equipmentGenderFilter, setEquipmentGenderFilter] = useState<'all' | 'L' | 'P'>('all');

  // Active Officer Name & Edit Modal for Logistics Handover
  const [activeOfficerName, setActiveOfficerName] = useState<string>(() => {
    return localStorage.getItem('admin_active_officer_name') || 'Hj. Fatimah (Admin Logistik)';
  });

  const handleOfficerNameChange = (val: string) => {
    setActiveOfficerName(val);
    localStorage.setItem('admin_active_officer_name', val);
  };

  const [editingOfficerModal, setEditingOfficerModal] = useState<{
    jamaahId: string;
    jamaahName: string;
    eqKey: 'koper' | 'ihram' | 'batik';
    eqTitle: string;
    currentOfficer: string;
  } | null>(null);

  const [customOfficerInput, setCustomOfficerInput] = useState<string>('');

  // Fetch real mitras from API
  useEffect(() => {
    const fetchMitras = async () => {
      try {
        const data = await api.get('/admin/mitra/list');
        if (Array.isArray(data)) {
          const formatted = data.map((m: any) => ({
            id: m.id,
            name: m.name || m.profile?.namaLengkap || 'Mitra',
            email: m.email || '',
            noWa: m.noWa || '',
            statusAkun: m.statusAkun || 'active',
            profile: m.profile
          }));
          setRealMitraList(formatted);
        }
      } catch (e) {
        console.warn('Failed to fetch real mitras from API, falling back to derived list:', e);
      }
    };
    fetchMitras();
  }, []);

  // Helper to sanitize and merge central DB with all scoped pax keys
  const sanitizeJamaahList = (parsed: any[]) => {
    let merged = Array.isArray(parsed) ? [...parsed] : [];

    // Scan all scoped keys in localStorage to preserve any entries saved by mitras
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('mitra_saved_pax_list')) {
          const rawScopedId = key.replace('mitra_saved_pax_list_', '').trim();
          const val = localStorage.getItem(key);
          if (val) {
            const list = JSON.parse(val);
            if (Array.isArray(list)) {
              list.forEach((pax: any) => {
                const paxName = (pax?.userName || pax?.namaLengkap || pax?.nama || pax?.fullName || pax?.name || pax?.pasporNama || '').trim();
                if (pax && paxName !== '' && !paxName.startsWith('Jamaah #')) {
                  const paxWithMitra = {
                    ...pax,
                    mitraId: pax.mitraId || (rawScopedId !== 'mitra_saved_pax_list' ? rawScopedId : ''),
                    userName: paxName
                  };
                  const existingIdx = merged.findIndex(m => {
                    const mName = (m?.userName || m?.namaLengkap || m?.nama || m?.fullName || m?.name || m?.pasporNama || '').trim();
                    return m.id === pax.id || (mName === paxName && (m.mitraEmail === pax.mitraEmail || m.mitraId === pax.mitraId || m.mitraId === paxWithMitra.mitraId));
                  });
                  if (existingIdx >= 0) {
                    // Combine payments
                    const existingPayments = merged[existingIdx].payments || [];
                    const newPayments = pax.payments || [];
                    const paymentMap = new Map();
                    
                    // We want terminal statuses (verified, approved, VERIFIED, rejected, REJECTED) to take precedence over pending status
                    [...existingPayments, ...newPayments].forEach(pm => {
                      const pmKey = pm.id || `${pm.date}_${pm.amount}_${pm.step}`;
                      const existingPm = paymentMap.get(pmKey);
                      if (existingPm) {
                        const isExistingTerminal = ['verified', 'approved', 'VERIFIED', 'rejected', 'REJECTED'].includes(existingPm.status);
                        const isNewTerminal = ['verified', 'approved', 'VERIFIED', 'rejected', 'REJECTED'].includes(pm.status);
                        if (isExistingTerminal && !isNewTerminal) {
                          // Keep the existing terminal status payment, do not overwrite it with the pending one
                          return;
                        }
                      }
                      paymentMap.set(pmKey, pm);
                    });

                    // Smart Document Status Merging
                    const pDocs = pax.documents || {};
                    const cDocs = merged[existingIdx].documents || {};
                    const mergedDocs: any = {};
                    const docKeys = new Set([...Object.keys(pDocs), ...Object.keys(cDocs)]);
                    docKeys.forEach(dk => {
                      const pDoc = pDocs[dk];
                      const cDoc = cDocs[dk];
                      if (!pDoc) {
                        mergedDocs[dk] = cDoc;
                      } else if (!cDoc) {
                        mergedDocs[dk] = pDoc;
                      } else {
                        // Keep whichever is verified or rejected (usually cDoc is the admin's copy)
                        // UNLESS pDoc has a different file/URL, indicating a new upload.
                        const isNewUpload = pDoc.url !== cDoc.url && pDoc.status === 'pending';
                        if (isNewUpload) {
                          mergedDocs[dk] = pDoc;
                        } else {
                          mergedDocs[dk] = {
                            ...pDoc,
                            ...cDoc,
                            status: (cDoc.status === 'verified' || cDoc.status === 'rejected') ? cDoc.status : (pDoc.status || cDoc.status)
                          };
                        }
                      }
                    });

                    // Smart Passport Info Merging
                    const mergedPassport = {
                      ...(pax.passportInfo || {}),
                      ...(merged[existingIdx].passportInfo || {})
                    };

                    merged[existingIdx] = {
                      ...paxWithMitra,
                      ...merged[existingIdx],
                      userName: paxName || merged[existingIdx].userName,
                      mitraId: merged[existingIdx].mitraId || paxWithMitra.mitraId,
                      payments: Array.from(paymentMap.values()),
                      documents: mergedDocs,
                      passportInfo: mergedPassport
                    };
                  } else {
                    merged.push(paxWithMitra);
                  }
                }
              });
            }
          }
        }
      }
    } catch (e) {}

    const fixed = merged.map(j => {
      if (!j) return j;
      let newJ = { ...j };
      
      const resolvedName = (newJ.userName || newJ.namaLengkap || newJ.nama || newJ.fullName || newJ.name || newJ.pasporNama || '').trim();
      if (resolvedName) {
        newJ.userName = resolvedName;
      }

      const oName = newJ.ordererName && newJ.ordererName !== 'Mitra Travel' ? newJ.ordererName : '';
      const oEmail = newJ.ordererEmail ? newJ.ordererEmail : '';

      if (!newJ.mitraName || newJ.mitraName === 'Mitra Travel' || newJ.mitraName.startsWith('Mitra:')) {
        if (oName) newJ.mitraName = oName;
      }
      if (!newJ.mitraEmail && oEmail) {
        newJ.mitraEmail = oEmail;
      }
      if ((!newJ.mitraId || newJ.mitraId === 'mitra-user') && newJ.mitraEmail) {
        newJ.mitraId = newJ.mitraEmail;
      }
      if ((!newJ.mitraId || newJ.mitraId === 'mitra-user') && newJ.mitraName && newJ.mitraName !== 'Mitra Travel') {
        newJ.mitraId = newJ.mitraName;
      }

      // Try matching with realMitraList
      if (realMitraList && realMitraList.length > 0) {
        const jMitraId = (newJ.mitraId || '').toLowerCase().trim();
        const jMitraEmail = (newJ.mitraEmail || '').toLowerCase().trim();
        const jMitraName = (newJ.mitraName || newJ.ordererName || '').split(' (')[0].trim().toLowerCase();

        const matchReal = realMitraList.find(rm => {
          const rmId = (rm.id || '').toLowerCase().trim();
          const rmEmail = (rm.email || '').toLowerCase().trim();
          const rmName = (rm.name || '').toLowerCase().trim();
          const rmBase = (rm.name || '').split(' (')[0].trim().toLowerCase();

          if (jMitraId && rmId && jMitraId === rmId) return true;
          if (jMitraEmail && rmEmail && jMitraEmail === rmEmail) return true;
          if (jMitraId && rmEmail && jMitraId === rmEmail) return true;
          if (jMitraEmail && rmId && jMitraEmail === rmId) return true;
          if (jMitraName && jMitraName.length > 1 && jMitraName !== 'mitra' && jMitraName !== 'mitra travel' && (rmBase === jMitraName || rmName.includes(jMitraName) || jMitraName.includes(rmBase))) return true;
          return false;
        });

        if (matchReal) {
          newJ.mitraId = matchReal.id;
          newJ.mitraName = matchReal.name;
          if (matchReal.email) newJ.mitraEmail = matchReal.email;
        }
      }

      return newJ;
    });

    return fixed.filter(j => {
      if (!j) return false;
      const name = (j.userName || j.namaLengkap || j.nama || j.fullName || j.name || j.pasporNama || '').trim();
      return name !== '' && !name.startsWith('Jamaah #');
    });
  };

  // Load initial database from localStorage or fallback
  const loadInitialDatabase = () => {
    try {
      const stored = localStorage.getItem('mitra_jamaah_database');
      const parsed = stored ? JSON.parse(stored) : [];
      return sanitizeJamaahList(parsed);
    } catch (e) {
      return [];
    }
  };

  const [jamaahList, setJamaahList] = useState<any[]>(loadInitialDatabase);

  // Fetch Jamaah directly from PostgreSQL API on mount
  useEffect(() => {
    const fetchJamaahFromDb = async () => {
      try {
        const dbJamaah = await api.get('/admin/mitra/all-jamaah');
        if (Array.isArray(dbJamaah) && dbJamaah.length > 0) {
          const sanitizedDb = sanitizeJamaahList(dbJamaah);
          setJamaahList(sanitizedDb);
          try {
            localStorage.setItem('mitra_jamaah_database', JSON.stringify(sanitizedDb));
          } catch (e) {}
        } else {
          // If PostgreSQL is currently empty, push any local storage data to PostgreSQL
          const localData = loadInitialDatabase();
          if (localData.length > 0) {
            await api.post('/admin/mitra/jamaah/sync', { jamaahList: localData }).catch(() => {});
            setJamaahList(localData);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch jamaah from PostgreSQL, using local database:', err);
      }
    };
    fetchJamaahFromDb();
  }, []);

  // Derive unique mitras from jamaahList and combine with real mitra list
  const mitras = useMemo(() => {
    const map = new Map<string, any>();
    
    // Process real mitras first (they take precedence)
    realMitraList.forEach(m => {
      const rawName = m.name || m.profile?.namaLengkap || 'Mitra';
      const baseName = rawName.split(' (')[0].trim();
      const mEmail = (m.email || '').toLowerCase().trim();
      const mId = (m.id || mEmail || baseName).trim();
      const key = mId.toLowerCase();

      map.set(key, { 
        id: m.id || mId, 
        name: rawName, 
        baseName,
        email: mEmail,
        noWa: m.noWa || '',
        statusAkun: m.statusAkun || 'active',
        profile: m.profile
      });
    });

    // Process from jamaah
    jamaahList.forEach((j: any) => {
      const jMitraId = (j.mitraId || '').trim();
      const jMitraEmail = (j.mitraEmail || j.ordererEmail || '').toLowerCase().trim();
      const rawName = j.mitraName || j.ordererName || j.mitraId || '';
      const baseName = rawName.split(' (')[0].trim();

      if (jMitraId || rawName || jMitraEmail) {
        // Check if matching mitra already exists in map
        let existingKey: string | null = null;
        for (const [k, m] of map.entries()) {
          const mId = (m.id || '').toLowerCase().trim();
          const mEmail = (m.email || '').toLowerCase().trim();
          const mBase = (m.baseName || '').toLowerCase().trim();
          const mName = (m.name || '').toLowerCase().trim();
          const jBase = baseName.toLowerCase().trim();
          const jIdLower = jMitraId.toLowerCase();

          if (
            (jIdLower && mId && jIdLower === mId) ||
            (jMitraEmail && mEmail && jMitraEmail === mEmail) ||
            (jIdLower && mEmail && jIdLower === mEmail) ||
            (jBase && jBase.length > 1 && jBase !== 'mitra' && jBase !== 'mitra travel' && (mBase === jBase || mName.includes(jBase) || jBase.includes(mBase)))
          ) {
            existingKey = k;
            break;
          }
        }

        if (!existingKey) {
          const jKey = (jMitraId || jMitraEmail || baseName || 'unknown').toLowerCase().trim();
          map.set(jKey, { 
            id: j.mitraId || jKey, 
            name: rawName || 'Mitra', 
            baseName: baseName || 'Mitra',
            email: jMitraEmail,
            noWa: j.mitraPhone || ''
          });
        } else {
          const existing = map.get(existingKey);
          if (existing && (existing.name === 'Mitra' || existing.name.startsWith('Mitra:')) && rawName && !rawName.startsWith('Mitra:')) {
            existing.name = rawName;
            existing.baseName = baseName;
          }
        }
      }
    });
    
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [realMitraList, jamaahList]);

  // Sync real-time updates from Mitra Panel & storage changes
  React.useEffect(() => {
    const handleSync = async () => {
      try {
        const dbJamaah = await api.get('/admin/mitra/all-jamaah').catch(() => null);
        if (Array.isArray(dbJamaah) && dbJamaah.length > 0) {
          setJamaahList(sanitizeJamaahList(dbJamaah));
        } else {
          const stored = localStorage.getItem('mitra_jamaah_database');
          const parsed = stored ? JSON.parse(stored) : [];
          setJamaahList(sanitizeJamaahList(parsed));
        }
      } catch (e) {}
    };

    window.addEventListener('mitra_jamaah_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('mitra_jamaah_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const saveAndSyncState = async (updatedList: any[]) => {
    setJamaahList(updatedList);
    try {
      localStorage.setItem('mitra_jamaah_database', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('mitra_jamaah_updated'));
    } catch (e) {}

    // Persist permanently to PostgreSQL
    try {
      await api.post('/admin/mitra/jamaah/sync', { jamaahList: updatedList });
    } catch (err) {
      console.warn('Failed to sync updated jamaah list to PostgreSQL:', err);
    }
  };

  const [selectedJamaahIdx, setSelectedJamaahIdx] = useState(0);
  const [activeDokumenJemaah, setActiveDokumenJemaah] = useState<any | null>(null);

  // Filter list by selected Mitra and search query
  const filteredJamaahList = jamaahList.filter((j) => {
    if (!j) return false;
    const jName = (j.userName || j.namaLengkap || j.nama || j.fullName || j.name || j.pasporNama || '').trim();
    if (!jName || jName.startsWith('Jamaah #')) return false;

    let matchesMitra = false;
    if (selectedMitraFilter === 'all') {
      matchesMitra = true;
    } else {
      const selLower = selectedMitraFilter.toLowerCase().trim();
      const targetMitra = mitras.find(m => 
        (m.id && m.id.toLowerCase().trim() === selLower) || 
        (m.baseName && m.baseName.toLowerCase().trim() === selLower) || 
        (m.email && m.email.toLowerCase().trim() === selLower) ||
        (m.name && m.name.toLowerCase().trim() === selLower)
      );

      const jMitraId = (j.mitraId || '').toLowerCase().trim();
      const jMitraEmail = (j.mitraEmail || j.ordererEmail || '').toLowerCase().trim();
      const jRawName = j.mitraName || j.ordererName || j.mitraId || '';
      const jBaseName = jRawName.split(' (')[0].trim().toLowerCase();

      if (targetMitra) {
        const tId = (targetMitra.id || '').toLowerCase().trim();
        const tEmail = (targetMitra.email || '').toLowerCase().trim();
        const tBaseName = (targetMitra.baseName || '').toLowerCase().trim();
        const tName = (targetMitra.name || '').toLowerCase().trim();

        matchesMitra = 
          (jMitraId && tId && jMitraId === tId) ||
          (jMitraEmail && tEmail && jMitraEmail === tEmail) ||
          (jMitraId && tEmail && jMitraId === tEmail) ||
          (
            jBaseName && 
            jBaseName.length > 1 && 
            jBaseName !== 'mitra' && 
            jBaseName !== 'mitra travel' && 
            (tBaseName === jBaseName || tName.includes(jBaseName) || jBaseName.includes(tBaseName) || tBaseName.includes(jBaseName))
          );
      } else {
        matchesMitra = (jMitraId === selLower) || (jBaseName === selLower) || (jMitraEmail === selLower);
      }
    }

    const matchesSearch = searchQuery === '' || 
      (jName && jName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (j.nik && j.nik.includes(searchQuery)) ||
      (j.pasporNo && j.pasporNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (j.mitraName && j.mitraName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (j.ordererName && j.ordererName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesMitra && matchesSearch;
  });

  const selectedJamaah = filteredJamaahList[selectedJamaahIdx] || filteredJamaahList[0] || jamaahList[0];

  const activeMitraCount = useMemo(() => {
    return mitras.length;
  }, [mitras]);

  // Grouped stats for dashboard - Professional Recap Logic
  const mitraStats = useMemo(() => {
    const stats: Record<string, {
      total: number;
      unverified: number;
      verified: number;
      totalPax: number;
      recentJamaah: any[];
    }> = {};

    // Pre-fill stats for all mitras with shared object reference per mitra
    mitras.forEach(m => {
      const obj = { total: 0, unverified: 0, verified: 0, totalPax: 0, recentJamaah: [] };
      if (m.id) {
        stats[m.id] = obj;
        stats[m.id.toLowerCase().trim()] = obj;
      }
      if (m.baseName) {
        stats[m.baseName] = obj;
        stats[m.baseName.toLowerCase().trim()] = obj;
      }
      if (m.email) {
        stats[m.email] = obj;
        stats[m.email.toLowerCase().trim()] = obj;
      }
      if (m.name) {
        stats[m.name] = obj;
        stats[m.name.toLowerCase().trim()] = obj;
      }
    });

    // Count valid jamaah entries
    const validJamaah = jamaahList.filter(j => {
      if (!j) return false;
      const name = (j.userName || j.namaLengkap || j.nama || j.fullName || j.name || j.pasporNama || '').trim();
      return name !== '' && !name.startsWith('Jamaah #');
    });

    validJamaah.forEach(j => {
      const jMitraId = (j.mitraId || '').toLowerCase().trim();
      const jMitraEmail = (j.mitraEmail || j.ordererEmail || '').toLowerCase().trim();
      const jRawName = j.mitraName || j.ordererName || j.mitraId || '';
      const jBaseName = jRawName.split(' (')[0].trim().toLowerCase();

      // Find matching mitra in `mitras` array strictly by ID, Email, Name or baseName (case-insensitive)
      const matchingMitra = mitras.find(m => {
        const mId = (m.id || '').toLowerCase().trim();
        const mEmail = (m.email || '').toLowerCase().trim();
        const mBase = (m.baseName || '').toLowerCase().trim();
        const mName = (m.name || '').toLowerCase().trim();

        if (jMitraId && mId && jMitraId === mId) return true;
        if (jMitraEmail && mEmail && jMitraEmail === mEmail) return true;
        if (jMitraId && mEmail && jMitraId === mEmail) return true;
        if (
          jBaseName && 
          jBaseName.length > 1 && 
          jBaseName !== 'mitra' && 
          jBaseName !== 'mitra travel' && 
          (mBase === jBaseName || mName.includes(jBaseName) || jBaseName.includes(mBase) || mBase.includes(jBaseName))
        ) return true;
        return false;
      });

      const key = matchingMitra ? matchingMitra.id : (j.mitraId || j.mitraEmail || jRawName || 'unknown');
      
      let targetObj = stats[key] || stats[key.toLowerCase().trim()];
      if (!targetObj) {
        targetObj = { total: 0, unverified: 0, verified: 0, totalPax: 0, recentJamaah: [] };
        stats[key] = targetObj;
        stats[key.toLowerCase().trim()] = targetObj;
      }
      
      targetObj.total++;
      if (j.statusBiodata === 'verified' || j.isComplete) {
        targetObj.verified++;
      } else {
        targetObj.unverified++;
      }
      
      targetObj.totalPax++;
      
      const jName = (j.userName || j.namaLengkap || j.nama || j.fullName || j.name || j.pasporNama || '').trim();
      if (jName && targetObj.recentJamaah.length < 3) {
        targetObj.recentJamaah.push(j);
      }

      if (matchingMitra) {
        if (matchingMitra.id) {
          stats[matchingMitra.id] = targetObj;
          stats[matchingMitra.id.toLowerCase().trim()] = targetObj;
        }
        if (matchingMitra.baseName) {
          stats[matchingMitra.baseName] = targetObj;
          stats[matchingMitra.baseName.toLowerCase().trim()] = targetObj;
        }
        if (matchingMitra.email) {
          stats[matchingMitra.email] = targetObj;
          stats[matchingMitra.email.toLowerCase().trim()] = targetObj;
        }
        if (matchingMitra.name) {
          stats[matchingMitra.name] = targetObj;
          stats[matchingMitra.name.toLowerCase().trim()] = targetObj;
        }
      }
    });

    return stats;
  }, [mitras, jamaahList]);

  const handleUpdateAdminNote = (id: string, note: string) => {
    const updated = jamaahList.map(j => j.id === id ? { ...j, adminNote: note } : j);
    saveAndSyncState(updated);
    if (selectedJamaahForDetail?.id === id) {
      setSelectedJamaahForDetail({ ...selectedJamaahForDetail, adminNote: note });
    }
  };

  const handleToggleVerifyBiodata = (id: string) => {
    const updated = jamaahList.map((j) => {
      if (j.id === id) {
        const nextStatus = j.statusBiodata === 'verified' ? 'pending' : 'verified';
        toast.success(`Status biodata ${j.userName} diubah menjadi: ${nextStatus === 'verified' ? 'TERVERIFIKASI' : 'PENDING'}`);
        return { ...j, statusBiodata: nextStatus };
      }
      return j;
    });
    saveAndSyncState(updated);
  };

  const handleApproveDoc = async (docKey: string) => {
    const target = activeDokumenJemaah || selectedJamaah;
    if (!target) return;
    
    try {
      await api.patch('/admin/documents/verify', {
        registrationId: target.id,
        docType: docKey,
        status: 'approved',
        rejectionReason: ''
      });
    } catch (err: any) {
      console.error("Gagal verifikasi dokumen di backend:", err);
      toast.error(`Gagal verifikasi dokumen di server: ${err.message || 'Server error'}`);
      return;
    }

    const updated = jamaahList.map((j) => {
      if (j.id === target.id) {
        const docs = j.documents || {};
        const updatedJ = {
          ...j,
          documents: {
            ...docs,
            [docKey]: { ...docs[docKey], status: 'verified' }
          }
        };
        if (activeDokumenJemaah?.id === j.id) setActiveDokumenJemaah(updatedJ);
        return updatedJ;
      }
      return j;
    });
    saveAndSyncState(updated);
    toast.success(`Dokumen ${docKey.toUpperCase()} jamaah ${target.userName} diverifikasi!`);
  };

  const handleRejectDoc = async (docKey: string) => {
    const target = activeDokumenJemaah || selectedJamaah;
    if (!target) return;

    try {
      await api.patch('/admin/documents/verify', {
        registrationId: target.id,
        docType: docKey,
        status: 'rejected',
        rejectionReason: 'Ditolak oleh admin'
      });
    } catch (err: any) {
      console.error("Gagal menolak dokumen di backend:", err);
      toast.error(`Gagal menolak dokumen di server: ${err.message || 'Server error'}`);
      return;
    }

    const updated = jamaahList.map((j) => {
      if (j.id === target.id) {
        const docs = j.documents || {};
        const updatedJ = {
          ...j,
          documents: {
            ...docs,
            [docKey]: { ...docs[docKey], status: 'rejected' }
          }
        };
        if (activeDokumenJemaah?.id === j.id) setActiveDokumenJemaah(updatedJ);
        return updatedJ;
      }
      return j;
    });
    saveAndSyncState(updated);
    toast.error(`Dokumen ${docKey.toUpperCase()} jamaah ${target.userName} ditolak.`);
  };

  const handleVerifyRejectPayment = async (payment: any, isApproved: boolean, fallbackJamaahId?: string) => {
    const isValidUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const targetStatus = isApproved ? 'verified' : 'rejected';
    const jId = payment.jamaahId || fallbackJamaahId;

    if (payment.id && isValidUUID(payment.id)) {
      try {
        await api.patch(`/admin/payments/${payment.id}/verify`, {
          status: isApproved ? 'approved' : 'rejected',
          reason: isApproved ? 'Disetujui oleh admin' : 'Ditolak oleh admin'
        });
      } catch (err: any) {
        console.warn("API update payment notice (will update local state):", err);
      }
    }

    const updated = jamaahList.map((j) => {
      const isTargetJamaah = (jId && j.id === jId) || 
        (j.payments || []).some((p: any, i: number) => 
          (payment.id && p.id === payment.id) || 
          (payment.proofUrl && p.proofUrl === payment.proofUrl) ||
          (p.amount === payment.amount && p.date === payment.date) ||
          (payment.pIdx !== undefined && i === payment.pIdx)
        );

      if (isTargetJamaah) {
        const updatedPayments = (j.payments || []).map((p: any, i: number) => {
          const isMatch = 
            (payment.id && p.id === payment.id) || 
            (payment.proofUrl && p.proofUrl === payment.proofUrl) ||
            (p.amount === payment.amount && p.date === payment.date && p.step === payment.step) ||
            (payment.pIdx !== undefined && i === payment.pIdx);
          
          return isMatch ? { ...p, status: targetStatus, verifiedAt: new Date().toISOString() } : p;
        });
        return { ...j, payments: updatedPayments };
      }
      return j;
    });

    // Also update in all scoped pax keys in localStorage to keep them in sync
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('mitra_saved_pax_list')) {
          const val = localStorage.getItem(key);
          if (val) {
            const list = JSON.parse(val);
            if (Array.isArray(list)) {
              let changed = false;
              const updatedList = list.map((pax: any) => {
                if (!pax || !pax.payments) return pax;
                const isTargetPax = (jId && pax.id === jId) || pax.payments.some((p: any, idx: number) => 
                  (payment.id && p.id === payment.id) || 
                  (payment.proofUrl && p.proofUrl === payment.proofUrl) ||
                  (p.amount === payment.amount && p.date === payment.date) ||
                  (payment.pIdx !== undefined && idx === payment.pIdx)
                );

                if (isTargetPax) {
                  changed = true;
                  const newPayments = pax.payments.map((p: any, idx: number) => {
                    const isMatch = 
                      (payment.id && p.id === payment.id) || 
                      (payment.proofUrl && p.proofUrl === payment.proofUrl) ||
                      (p.amount === payment.amount && p.date === payment.date && p.step === payment.step) ||
                      (payment.pIdx !== undefined && idx === payment.pIdx);
                    return isMatch ? { ...p, status: targetStatus, verifiedAt: new Date().toISOString() } : p;
                  });
                  return { ...pax, payments: newPayments };
                }
                return pax;
              });

              if (changed) {
                localStorage.setItem(key, JSON.stringify(updatedList));
              }
            }
          }
        }
      }
    } catch (e) {}

    saveAndSyncState(updated);
    
    if (isApproved) {
      toast.success('Pembayaran berhasil diverifikasi!');
    } else {
      toast.error('Pembayaran ditolak!');
    }

    if (onRefresh) {
      try {
        onRefresh();
      } catch (e) {}
    }
  };

  const handleDownloadZip = async () => {
    if (!activeDokumenJemaah) return;
    const docs = activeDokumenJemaah.documents;
    if (!docs || Object.keys(docs).length === 0) {
      toast.error('Jemaah belum mengunggah dokumen apapun.');
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder(`${activeDokumenJemaah.userName.replace(/\s+/g, '_')}_Dokumen`);
    
    const toastId = toast.loading('Menyiapkan ZIP dokumen...');

    try {
      const promises = Object.entries(docs).map(async ([key, docVal]: [string, any]) => {
        if (!docVal.url) return;
        
        try {
          const response = await fetch(docVal.url);
          const blob = await response.blob();
          
          // Determine extension from fileType or URL
          let extension = 'jpg';
          if (docVal.fileType === 'application/pdf' || docVal.url.toLowerCase().endsWith('.pdf')) {
            extension = 'pdf';
          } else if (docVal.fileType === 'image/png' || docVal.url.toLowerCase().endsWith('.png')) {
            extension = 'png';
          }
          
          folder?.file(`${key}_${activeDokumenJemaah.userName.replace(/\s+/g, '_')}.${extension}`, blob);
        } catch (err) {
          console.error(`Failed to download ${key}:`, err);
        }
      });

      await Promise.all(promises);
      
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${activeDokumenJemaah.userName.replace(/\s+/g, '_')}_Dokumen.zip`);
      toast.dismiss(toastId);
      toast.success('ZIP dokumen berhasil diunduh!');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Gagal membuat ZIP dokumen.');
      console.error(err);
    }
  };

  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [paymentSubTab, setPaymentSubTab] = useState<'individual' | 'rekap' | 'rekap_all'>('rekap_all');
  const [rekapSearchQuery, setRekapSearchQuery] = useState('');
  const [rekapStatusFilter, setRekapStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  const handleExportPayments = () => {
    if (jamaahList.length === 0) {
      toast.error('Tidak ada data pembayaran untuk diekspor.');
      return;
    }

    const allPayments: any[] = [];
    jamaahList.forEach(j => {
      if (j.payments && Array.isArray(j.payments)) {
        j.payments.forEach((p: any) => {
          allPayments.push({
            jamaahName: j.userName,
            jamaahId: j.id,
            packageName: j.packageName || 'Belum Pilih Paket',
            stage: p.stage || p.step || 'DP',
            amount: Number(p.amount || 0),
            bank: p.bank || 'Bank Transfer',
            date: p.date || '-',
            time: p.time || '',
            status: p.status || 'pending'
          });
        });
      }
    });

    if (allPayments.length === 0) {
      toast.error('Belum ada transaksi pembayaran yang tercatat.');
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Header Banner
    doc.setFillColor(21, 62, 43); // Dark green #153e2b
    doc.rect(0, 0, pageWidth, 30, 'F');

    // Header Left
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("PT. GOLDEN TOUR HARAMAIN", 14, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Laporan Rekapitulasi Pembayaran Keuangan Jemaah", 14, 18);
    doc.text("Sistem Manajemen Terpadu Umrah & Haji Khusus", 14, 23);

    // Header Right
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("LAPORAN KEUANGAN JEMAAH", pageWidth - 14, 12, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const mitraText = selectedMitraFilter === 'all' ? 'Semua Mitra' : selectedMitraFilter;
    doc.text(`Kategori: ${mitraText}`, pageWidth - 14, 18, { align: "right" });
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 14, 23, { align: "right" });

    // Accent line
    doc.setFillColor(217, 119, 6); // Gold #d97706
    doc.rect(0, 30, pageWidth, 2.5, 'F');

    // 2. Summary Cards Box
    const totalVerified = allPayments
      .filter(p => ['verified', 'approved', 'VERIFIED'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPending = allPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 38, pageWidth - 28, 16, 3, 3, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Total Jemaah: ${jamaahList.length} Orang`, 20, 48);
    doc.text(`Total Transaksi: ${allPayments.length} Record`, 75, 48);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(21, 62, 43);
    doc.text(`Total Terverifikasi: Rp ${totalVerified.toLocaleString('id-ID')}`, 145, 48);
    if (totalPending > 0) {
      doc.setTextColor(180, 83, 9);
      doc.text(`Pending Verifikasi: Rp ${totalPending.toLocaleString('id-ID')}`, 220, 48);
    }

    // 3. Table Output
    const tableData = allPayments.map((p, idx) => [
      (idx + 1).toString(),
      p.jamaahName,
      p.jamaahId,
      p.packageName,
      p.stage,
      p.bank,
      `Rp ${p.amount.toLocaleString('id-ID')}`,
      p.date,
      ['verified', 'approved', 'VERIFIED'].includes(p.status) ? 'TERVERIFIKASI' : p.status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: 59,
      margin: { left: 14, right: 14 },
      head: [['No', 'Nama Jemaah', 'ID Jemaah', 'Paket Umroh', 'Tahap', 'Bank', 'Nominal', 'Tanggal', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [21, 62, 43],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 42, fontStyle: 'bold' },
        2: { cellWidth: 35 },
        3: { cellWidth: 40 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 },
        6: { cellWidth: 35, fontStyle: 'bold', halign: 'right' },
        7: { cellWidth: 25 },
        8: { cellWidth: 27, halign: 'center', fontStyle: 'bold' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 8) {
          const val = data.cell.raw;
          if (val === 'TERVERIFIKASI') {
            data.cell.styles.textColor = [22, 101, 52];
          } else if (val === 'REJECTED') {
            data.cell.styles.textColor = [185, 28, 28];
          } else {
            data.cell.styles.textColor = [180, 83, 9];
          }
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;

    // Footer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Laporan ini dicetak secara otomatis melalui Portal Keuangan Admin PT. Golden Tour Haramain.", 14, Math.min(finalY + 12, pageHeight - 10));
    doc.text(`Dokumen Resmi - Diterbitkan pada ${new Date().toLocaleString('id-ID')}`, pageWidth - 14, Math.min(finalY + 12, pageHeight - 10), { align: "right" });

    doc.save(`Laporan_Keuangan_Jemaah_${selectedMitraFilter === 'all' ? 'Semua' : selectedMitraFilter}_${Date.now()}.pdf`);
    toast.success('Laporan rekapitulasi pembayaran (PDF) berhasil diunduh.');
  };

  const terbilang = (n: number): string => {
    const angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let num = Math.floor(Math.abs(n));
    if (num < 12) return angka[num];
    if (num < 20) return terbilang(num - 10) + " Belas";
    if (num < 100) return (angka[Math.floor(num / 10)] ? angka[Math.floor(num / 10)] + " Puluh " : "") + terbilang(num % 10);
    if (num < 200) return "Seratus " + terbilang(num - 100);
    if (num < 1000) return (angka[Math.floor(num / 100)] ? angka[Math.floor(num / 100)] + " Ratus " : "") + terbilang(num % 100);
    if (num < 2000) return "Seribu " + terbilang(num - 1000);
    if (num < 1000000) return terbilang(Math.floor(num / 1000)) + " Ribu " + terbilang(num % 1000);
    if (num < 1000000000) return terbilang(Math.floor(num / 1000000)) + " Juta " + terbilang(num % 1000000);
    if (num < 1000000000000) return terbilang(Math.floor(num / 1000000000)) + " Miliar " + terbilang(num % 1000000000);
    return "";
  };

  const getTerbilangRupiah = (amount: number): string => {
    if (!amount || amount <= 0) return "# Nol Rupiah #";
    const result = terbilang(amount).replace(/\s+/g, ' ').trim();
    return `# ${result} Rupiah #`;
  };

  const handleDownloadReceipt = (jamaah: any, payment: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Generate IDs and strings
    const paymentId = payment.id || 'TRX-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const cleanId = paymentId.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(-6) || '44B25B';
    const kwtNo = `KWT/GTH/202608/${cleanId}`;
    const refServer = `TRX-GTH-2026-${cleanId}DC`;
    
    const formattedAmount = Number(payment.amount || 0).toLocaleString('id-ID');
    const terbilangText = getTerbilangRupiah(Number(payment.amount || 0));
    
    const displayDate = payment.date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const fullDate = payment.date ? `${payment.date} ${payment.time || 'pukul 21.16'}`.trim() : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // 1. Dark Green Header Banner (Y: 0 - 32mm)
    doc.setFillColor(21, 62, 43); // #153e2b
    doc.rect(0, 0, pageWidth, 32, 'F');

    // Header Left: Title & Subtitles
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("PT. GOLDEN TOUR HARAMAIN", 14, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Layanan Penyelenggara Perjalanan Ibadah Umrah & Haji Khusus", 14, 18);
    doc.text("Izin Resmi Kemenag RI (PPIU/PIHK) | Layanan Jamaah & Keuangan", 14, 23);

    // Header Right: Title & Receipt Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("KUITANSI PEMBAYARAN RESMI", pageWidth - 14, 12, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`No. Kuitansi: ${kwtNo}`, pageWidth - 14, 18, { align: "right" });
    doc.text(`Tanggal: ${displayDate}`, pageWidth - 14, 23, { align: "right" });

    // 2. Yellow/Gold Accent Stripe
    doc.setFillColor(217, 119, 6); // gold accent #d97706
    doc.rect(0, 32, pageWidth, 2.5, 'F');

    // 3. Card Box: Rincian Transaksi Setoran Jamaah (Y: 40 - 62)
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(14, 40, pageWidth - 28, 22, 3, 3, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("Rincian Transaksi Setoran Jamaah", 20, 47);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Ref ID Server: ${refServer}`, 20, 53);
    doc.text(`Status Verifikasi: VERIFIED / LUNAS DITERIMA`, 20, 58);

    // 4. Detailed Table using autoTable
    autoTable(doc, {
      startY: 68,
      margin: { left: 14, right: 14 },
      head: [['RINCIAN ITEM', 'KETERANGAN BUKTI PEMBAYARAN']],
      body: [
        ['Nomor Kuitansi', kwtNo],
        ['Nama Jamaah / Penyetor', jamaah.userName || 'Brian'],
        ['Nomor Kontak / Telepon', jamaah.phone || jamaah.phoneNumber || '081218272734'],
        ['Email Jamaah', jamaah.email || `${(jamaah.userName || 'jamaah').toLowerCase().replace(/\s+/g, '')}@gmail.com`],
        ['Paket Umroh', jamaah.packageName || 'Hujan Umroh'],
        ['Tahap Pembayaran', payment.step || payment.stage || 'Pelunasan Sisa Tagihan'],
        ['Metode Pembayaran', payment.bank ? (payment.bank.includes('Transfer') ? payment.bank : `Transfer Bank (${payment.bank})`) : 'Transfer Bank (Verifikasi Sistem)'],
        ['Tanggal Setoran', fullDate],
        ['JUMLAH SETORAN DITERIMA', `Rp ${formattedAmount}`],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [21, 62, 43],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 3.5,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59],
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 65, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
      },
      didParseCell: function(data) {
        if (data.row.index === 8) { // JUMLAH SETORAN DITERIMA row
          data.cell.styles.fillColor = [226, 236, 233];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [21, 62, 43];
          data.cell.styles.fontSize = 9.5;
        }
      }
    });

    const tableFinalY = (doc as any).lastAutoTable.finalY || 150;

    // 5. TERBILANG Box
    const terbilangY = tableFinalY + 6;
    doc.setFillColor(240, 253, 244); // light green #f0fdf4
    doc.setDrawColor(187, 247, 208); // green border #bbf7d0
    doc.roundedRect(14, terbilangY, pageWidth - 28, 16, 3, 3, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(21, 62, 43);
    doc.text("TERBILANG :", 20, terbilangY + 10);

    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52); // green-800
    doc.text(terbilangText, 46, terbilangY + 10);

    // 6. Signature Block
    const sigY = terbilangY + 28;
    const sigX = pageWidth - 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Batam, ${displayDate}`, sigX, sigY, { align: "right" });
    doc.text("Disetujui & Disahkan oleh,", sigX, sigY + 5, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text("Departemen Keuangan & Akuntansi", sigX, sigY + 10, { align: "right" });

    // Space for Signature
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(21, 62, 43);
    doc.text("AHMAD DAUD", sigX, sigY + 32, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Head of Finance & Treasury", sigX, sigY + 36, { align: "right" });

    // Save PDF
    doc.save(`Kuitansi_${(jamaah.userName || 'Jamaah').replace(/\s+/g, '_')}_${cleanId}.pdf`);
    toast.success('Kuitansi PDF resmi berhasil dicetak.');
  };

  const handleDeletePayment = (jamaahId: string, paymentId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Catatan Pembayaran',
      message: 'Apakah Anda yakin ingin menghapus catatan transaksi ini? Tindakan ini tidak dapat dibatalkan.',
      type: 'danger',
      onConfirm: () => {
        const updated = jamaahList.map((j) => {
          if (j.id === jamaahId) {
            return {
              ...j,
              payments: (j.payments || []).filter((p: any) => (p.id || p.pIdx?.toString()) !== paymentId)
            };
          }
          return j;
        });

        setJamaahList(updated);
        saveAndSyncState(updated);
        toast.success('Catatan transaksi pembayaran berhasil dihapus.');
      }
    });
  };

  const handleApprovePayment = () => {
    if (!selectedJamaah) return;
    const updated = jamaahList.map((j) => {
      if (j.id === selectedJamaah.id) {
        return {
          ...j,
          totalPaid: j.packagePrice || j.totalPrice || 32500000,
          paymentStep: 'lunas',
          statusPayment: 'verified'
        };
      }
      return j;
    });
    saveAndSyncState(updated);
    toast.success(`Pelunasan pembayaran ${selectedJamaah.userName} telah disetujui!`);
  };

  const getJamaahGender = (j: any): 'L' | 'P' => {
    const g = (j.jenisKelamin || j.gender || j.jk || '').toString().toLowerCase();
    if (g.includes('p') || g.includes('wanita') || g.includes('perempuan') || g.includes('female')) {
      return 'P';
    }
    return 'L';
  };

  const toggleEquipmentForJamaah = (jamaahId: string, eqKey: 'koper' | 'ihram' | 'batik') => {
    const assignedOfficer = activeOfficerName.trim() || 'Admin Logistik';
    const updated = jamaahList.map((j) => {
      if (j.id === jamaahId) {
        const currentEq = j.equipment || {};
        const currentVal = currentEq[eqKey] ?? false;
        const nextVal = !currentVal;
        
        const newEquipment = {
          ...currentEq,
          [eqKey]: nextVal,
          ...(eqKey === 'koper' ? { koperTas: nextVal } : {}),
          ...(eqKey === 'ihram' ? { kainIhram: nextVal } : {}),
          ...(eqKey === 'batik' ? { seragamBatik: nextVal } : {})
        };

        const currentOfficers = j.equipmentOfficers || {};
        const newOfficers = {
          ...currentOfficers,
          [eqKey]: nextVal ? assignedOfficer : (currentOfficers[eqKey] || assignedOfficer)
        };

        return {
          ...j,
          equipment: newEquipment,
          equipmentOfficers: newOfficers
        };
      }
      return j;
    });

    saveAndSyncState(updated);
    toast.success(`Status perlengkapan jamaah dicatat oleh ${assignedOfficer}!`);
  };

  const toggleAllEquipmentForJamaah = (jamaahId: string, setAllTaken: boolean) => {
    const assignedOfficer = setAllTaken ? (activeOfficerName.trim() || 'Admin Logistik') : 'Admin Logistik';
    const updated = jamaahList.map((j) => {
      if (j.id === jamaahId) {
        return {
          ...j,
          equipment: {
            koper: setAllTaken,
            ihram: setAllTaken,
            batik: setAllTaken,
            koperTas: setAllTaken,
            kainIhram: setAllTaken,
            seragamBatik: setAllTaken
          },
          equipmentOfficers: {
            koper: assignedOfficer,
            ihram: assignedOfficer,
            batik: assignedOfficer
          }
        };
      }
      return j;
    });

    saveAndSyncState(updated);
    toast.success(setAllTaken ? `Seluruh perlengkapan dicatat oleh ${assignedOfficer}.` : 'Status perlengkapan di-reset.');
  };

  const saveCustomOfficerForItem = () => {
    if (!editingOfficerModal) return;
    const { jamaahId, eqKey, eqTitle, jamaahName } = editingOfficerModal;
    const finalOfficer = customOfficerInput.trim() || activeOfficerName || 'Admin Logistik';

    const updated = jamaahList.map((j) => {
      if (j.id === jamaahId) {
        const currentOfficers = j.equipmentOfficers || {};
        return {
          ...j,
          equipmentOfficers: {
            ...currentOfficers,
            [eqKey]: finalOfficer
          }
        };
      }
      return j;
    });

    saveAndSyncState(updated);
    toast.success(`Petugas untuk ${eqTitle} (${jamaahName}) diperbarui menjadi "${finalOfficer}"`);
    setEditingOfficerModal(null);
  };

  const mitraContributionStats = useMemo(() => {
    const map = new Map<string, {
      mitraName: string;
      totalJamaah: number;
      koperCount: number;
      ihramCount: number;
      batikCount: number;
      completeCount: number;
    }>();

    filteredJamaahList.forEach((j) => {
      const mName = j.mitraName || j.mitraId || 'Mitra Umum';
      const baseName = mName.split(' (')[0].trim();

      if (!map.has(baseName)) {
        map.set(baseName, {
          mitraName: baseName,
          totalJamaah: 0,
          koperCount: 0,
          ihramCount: 0,
          batikCount: 0,
          completeCount: 0
        });
      }

      const stat = map.get(baseName)!;
      stat.totalJamaah++;

      const eq = j.equipment || {};
      const isKoper = eq.koper ?? eq.koperTas ?? false;
      const isIhram = eq.ihram ?? eq.kainIhram ?? false;
      const isBatik = eq.batik ?? eq.seragamBatik ?? false;

      if (isKoper) stat.koperCount++;
      if (isIhram) stat.ihramCount++;
      if (isBatik) stat.batikCount++;
      if (isKoper && isIhram && isBatik) stat.completeCount++;
    });

    return Array.from(map.values()).sort((a, b) => b.totalJamaah - a.totalJamaah);
  }, [filteredJamaahList]);

  const handleDownloadEquipmentReceipt = (jamaah: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const gender = getJamaahGender(jamaah);
    const isFemale = gender === 'P';

    const eq = jamaah.equipment || {};
    const isKoperTaken = eq.koper ?? eq.koperTas ?? false;
    const isIhramTaken = eq.ihram ?? eq.kainIhram ?? false;
    const isBatikTaken = eq.batik ?? eq.seragamBatik ?? false;

    const officers = jamaah.equipmentOfficers || {};
    const defaultOfficer = activeOfficerName || 'Admin Logistik';

    const koperOfficer = isKoperTaken ? (officers.koper || defaultOfficer) : '-';
    const ihramOfficer = isIhramTaken ? (officers.ihram || defaultOfficer) : '-';
    const batikOfficer = isBatikTaken ? (officers.batik || defaultOfficer) : '-';

    const jamaahIdClean = (jamaah.id || 'JAM').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const docNo = `LOG/GTH/2026/${jamaahIdClean.slice(-5)}`;

    // 1. Header Banner (Dark Emerald)
    doc.setFillColor(21, 62, 43); // #153e2b
    doc.rect(0, 0, pageWidth, 32, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("PT. GOLDEN TOUR HARAMAIN", 14, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("TANDA TERIMA SERAH TERIMA PERLENGKAPAN UMROH & HAJI KHUSUS", 14, 18);
    doc.text("Izin Resmi Kemenag RI (PPIU/PIHK) | Divisi Logistik & Keberangkatan", 14, 23);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("BUKTI RESMI SERAH TERIMA", pageWidth - 14, 12, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`No. Bukti: ${docNo}`, pageWidth - 14, 18, { align: "right" });
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 14, 23, { align: "right" });

    // Gold Accent Stripe
    doc.setFillColor(217, 119, 6);
    doc.rect(0, 32, pageWidth, 2.5, 'F');

    // 2. Info Box Profile Jamaah
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 40, pageWidth - 28, 28, 3, 3, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`PROFIL REKAPITULASI JEMAAH : ${(jamaah.userName || 'Jamaah').toUpperCase()}`, 20, 47);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`NIK Jamaah: ${jamaah.nik || '-'}`, 20, 53);
    doc.text(`Jenis Kelamin: ${isFemale ? 'Perempuan (Wanita)' : 'Laki-Laki (Pria)'}`, 20, 58);
    doc.text(`Mitra Penanggung Jawab: ${jamaah.mitraName || 'Mitra Travel'}`, 20, 63);

    doc.text(`Paket Umroh: ${jamaah.packageName || 'Paket Umroh Executive'}`, 120, 53);
    doc.text(`Status Kelengkapan: ${(isKoperTaken && isIhramTaken && isBatikTaken) ? 'LENGKAP (100%)' : 'SEBAGIAN / BELUM LENGKAP'}`, 120, 58);
    doc.text(`Petugas Aktif Serah Terima: ${defaultOfficer}`, 120, 63);

    // 3. Equipment Table
    autoTable(doc, {
      startY: 74,
      margin: { left: 14, right: 14 },
      head: [['NO', 'ITEM PERLENGKAPAN LOGISTIK', 'SPESIFIKASI & KOMPONEN', 'STATUS TERIMA', 'PETUGAS PENANGGUNG JAWAB']],
      body: [
        [
          '1',
          'Koper & Tas Travel',
          'Koper Bagasi 24", Kabin 20", Tas Paspor & ID Card Tag',
          isKoperTaken ? 'SUDAH DIAMBIL' : 'BELUM DIAMBIL',
          koperOfficer
        ],
        [
          '2',
          isFemale ? 'Set Mukena Syar\'i & Bergo' : 'Set Kain Ihram & Sabuk',
          isFemale ? 'Set Mukena Eksklusif, Bergo Syar\'i & Tas Mukena' : 'Set Kain Ihram Katun Premium (2 Pcs) & Sabuk Ihram',
          isIhramTaken ? 'SUDAH DIAMBIL' : 'BELUM DIAMBIL',
          ihramOfficer
        ],
        [
          '3',
          'Seragam Batik & Buku Doa',
          'Kain Batik Seragam Official Travel & Buku Panduan Doa Saku',
          isBatikTaken ? 'SUDAH DIAMBIL' : 'BELUM DIAMBIL',
          batikOfficer
        ]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [21, 62, 43],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        cellPadding: 3.5,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59],
        cellPadding: 3.5,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 50, fontStyle: 'bold' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 32, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 42, halign: 'left' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 3) {
          if (data.cell.raw === 'SUDAH DIAMBIL') {
            data.cell.styles.textColor = [22, 101, 52];
            data.cell.styles.fillColor = [240, 253, 244];
          } else {
            data.cell.styles.textColor = [180, 83, 9];
            data.cell.styles.fillColor = [254, 243, 199];
          }
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 135;

    // 4. Syarat & Ketentuan Legal Box
    const termsY = finalY + 6;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, termsY, pageWidth - 28, 16, 2, 2, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text("CATATAN & SYARAT KETENTUAN PENYERAHAN LOGISTIK:", 18, termsY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text("1. Item perlengkapan yang diserahterimakan telah diperiksa secara fisik dan dinyatakan dalam kondisi baik & lengkap.", 18, termsY + 9);
    doc.text("2. Tanda terima ini menjadi bukti sah penyerahan barang antara PT. Golden Tour Haramain dan Calon Jemaah / Penerima Kuasa.", 18, termsY + 13);

    // 5. Dual Signatures (Centered Columns)
    const sigY = termsY + 24;
    const leftCenterX = 50; // Center point of left signature block
    const rightCenterX = pageWidth - 50; // Center point of right signature block

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    doc.text("Penerima / Jemaah,", leftCenterX, sigY, { align: "center" });
    doc.text("( _________________________ )", leftCenterX, sigY + 26, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(jamaah.userName || 'Jamaah', leftCenterX, sigY + 31, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.text(`Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, rightCenterX, sigY, { align: "center" });
    doc.text("Petugas Logistik Penanggung Jawab,", rightCenterX, sigY + 5, { align: "center" });
    doc.text("( _________________________ )", rightCenterX, sigY + 26, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(defaultOfficer, rightCenterX, sigY + 31, { align: "center" });

    doc.save(`Tanda_Terima_Perlengkapan_${(jamaah.userName || 'Jamaah').replace(/\s+/g, '_')}.pdf`);
    toast.success(`Tanda Terima Perlengkapan (${jamaah.userName}) berhasil diunduh (PDF).`);
  };

  const handleDownloadAllEquipmentReport = () => {
    if (filteredJamaahList.length === 0) {
      toast.error('Tidak ada data calon jemaah.');
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4'); // A4 Landscape: 297mm x 210mm
    const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210mm

    // Header Background
    doc.setFillColor(21, 62, 43); // Dark Emerald
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("PT. GOLDEN TOUR HARAMAIN", 12, 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("LAPORAN REKAPITULASI PENYERAHAN LOGISTIK & PERLENGKAPAN JAMAAH", 12, 17);
    doc.text("Divisi Keberangkatan & Logistik Central | Izin PPIU / PIHK Kemenag RI", 12, 22);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("DOKUMEN REKAPITULASI RESMI", pageWidth - 12, 11, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Filter Mitra: ${selectedMitraFilter === 'all' ? 'Semua Mitra Penanggung Jawab' : selectedMitraFilter}`, pageWidth - 12, 17, { align: "right" });
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 12, 22, { align: "right" });

    // Gold Accent Line
    doc.setFillColor(217, 119, 6);
    doc.rect(0, 30, pageWidth, 2.5, 'F');

    // Stats Summary Sub-Header
    const tuntasCount = filteredJamaahList.filter(j => {
      const eq = j.equipment || {};
      return (eq.koper ?? eq.koperTas) && (eq.ihram ?? eq.kainIhram) && (eq.batik ?? eq.seragamBatik);
    }).length;
    const tuntasPct = filteredJamaahList.length > 0 ? Math.round((tuntasCount / filteredJamaahList.length) * 100) : 0;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(12, 35, pageWidth - 24, 12, 2, 2, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`RINGKASAN STATUS DISTRIBUTION: Total Jemaah: ${filteredJamaahList.length} Orang  |  Penyerahan Tuntas (100%): ${tuntasCount} Jemaah (${tuntasPct}%)  |  Petugas Serah Terima: ${activeOfficerName || 'Admin Logistik'}`, 16, 42.5);

    const rows = filteredJamaahList.map((j, idx) => {
      const gender = getJamaahGender(j);
      const isFemale = gender === 'P';
      const eq = j.equipment || {};
      const isKoper = eq.koper ?? eq.koperTas ?? false;
      const isIhram = eq.ihram ?? eq.kainIhram ?? false;
      const isBatik = eq.batik ?? eq.seragamBatik ?? false;

      return [
        (idx + 1).toString(),
        j.userName || '-',
        `${j.nik || '-'}\n(${isFemale ? 'Perempuan' : 'Laki-Laki'})`,
        j.mitraName || '-',
        j.packageName || 'Paket Umroh',
        isKoper ? 'SUDAH' : 'BELUM',
        isFemale ? (isIhram ? 'SUDAH\n(Mukena)' : 'BELUM\n(Mukena)') : (isIhram ? 'SUDAH\n(Ihram)' : 'BELUM\n(Ihram)'),
        isBatik ? 'SUDAH' : 'BELUM',
        (isKoper && isIhram && isBatik) ? 'LENGKAP (100%)' : 'BELUM LENGKAP'
      ];
    });

    // Printable width = 297 - 24 = 273mm
    autoTable(doc, {
      startY: 50,
      margin: { left: 12, right: 12 },
      head: [['NO', 'NAMA JAMAAH', 'NIK / GENDER', 'MITRA PENANGGUNG JAWAB', 'PAKET UMROH', 'KOPER & TAS', 'SET IHRAM / MUKENA', 'BATIK & DOA', 'STATUS PROGRES']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [21, 62, 43],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 3,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
        cellPadding: 2.5,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 40, fontStyle: 'bold' },
        2: { cellWidth: 28 },
        3: { cellWidth: 42 },
        4: { cellWidth: 38 },
        5: { cellWidth: 26, halign: 'center' },
        6: { cellWidth: 28, halign: 'center' },
        7: { cellWidth: 26, halign: 'center' },
        8: { cellWidth: 35, halign: 'center', fontStyle: 'bold' }
      },
      didParseCell: function(data) {
        if (data.section === 'body') {
          // Highlight equipment status columns (5, 6, 7)
          if ([5, 6, 7].includes(data.column.index)) {
            const val = String(data.cell.raw || '');
            if (val.includes('SUDAH')) {
              data.cell.styles.textColor = [22, 101, 52];
              data.cell.styles.fillColor = [240, 253, 244];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [180, 83, 9];
              data.cell.styles.fillColor = [254, 243, 199];
            }
          }
          // Highlight overall progress column (8)
          if (data.column.index === 8) {
            const val = String(data.cell.raw || '');
            if (val.includes('LENGKAP (100%)')) {
              data.cell.styles.textColor = [22, 101, 52];
              data.cell.styles.fillColor = [220, 252, 231];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [180, 83, 9];
              data.cell.styles.fillColor = [254, 243, 199];
            }
          }
        }
      },
      didDrawPage: function (data) {
        // Page Number Footer
        const pageCount = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : ((doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : 1);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(`Halaman ${data.pageNumber} dari ${pageCount}  |  Dokumen Resmi Logistik PT. Golden Tour Haramain`, 12, pageHeight - 8);
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, pageWidth - 12, pageHeight - 8, { align: 'right' });
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 140;

    // Signature Block if space allows
    if (finalY + 35 < pageHeight - 15) {
      const sigY = finalY + 10;
      const rightCenterX = pageWidth - 45;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      doc.text(`Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, rightCenterX, sigY, { align: "center" });
      doc.text("Disahkan & Disetujui oleh,", rightCenterX, sigY + 4, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text("Kepala Divisi Logistik & Keberangkatan", rightCenterX, sigY + 8, { align: "center" });

      doc.text("( _________________________ )", rightCenterX, sigY + 22, { align: "center" });
      doc.text(activeOfficerName || "Hj. Fatimah (Admin Logistik)", rightCenterX, sigY + 26, { align: "center" });
    }

    doc.save(`Rekap_Perlengkapan_Jamaah_${new Date().toISOString().slice(0,10)}.pdf`);
    toast.success('Laporan rekapitulasi perlengkapan berhasil diunduh (PDF Landscape).');
  };

  const toggleIssuedDocForJamaah = (jamaahId: string, docKey: 'tiket' | 'visa' | 'polis') => {
    const updated = jamaahList.map((j) => {
      if (j.id === jamaahId) {
        const currentDocs = j.issuedDocs || { tiket: true, visa: true, polis: true };
        const currentVal = currentDocs[docKey] ?? true;
        const nextDocs = {
          ...currentDocs,
          [docKey]: !currentVal
        };
        return {
          ...j,
          issuedDocs: nextDocs
        };
      }
      return j;
    });
    setJamaahList(updated);
    saveAndSyncState(updated);
    toast.success(`Status persetujuan dokumen ${docKey.toUpperCase()} diperbarui.`);
  };

  const toggleAllIssuedDocsForJamaah = (jamaahId: string, setAllApproved: boolean) => {
    const updated = jamaahList.map((j) => {
      if (j.id === jamaahId) {
        return {
          ...j,
          issuedDocs: {
            tiket: setAllApproved,
            visa: setAllApproved,
            polis: setAllApproved
          }
        };
      }
      return j;
    });
    setJamaahList(updated);
    saveAndSyncState(updated);
    toast.success(setAllApproved ? 'Semua dokumen (Tiket, Visa, Polis) berhasil disetujui & diterbitkan!' : 'Status persetujuan dokumen direset.');
  };

  const handleAdminFileUpload = (jamaahId: string, docKey: 'tiket' | 'visa' | 'polis', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('File yang diupload harus berformat PDF!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const updated = jamaahList.map((j) => {
        if (j.id === jamaahId) {
          const currentDocs = j.issuedDocs || { tiket: true, visa: true, polis: true };
          const currentFiles = j.docFiles || {};
          return {
            ...j,
            issuedDocs: {
              ...currentDocs,
              [docKey]: true
            },
            docFiles: {
              ...currentFiles,
              [docKey]: {
                name: file.name,
                data: base64Data,
                size: (file.size / 1024).toFixed(1) + ' KB',
                uploadedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              }
            }
          };
        }
        return j;
      });
      setJamaahList(updated);
      saveAndSyncState(updated);
      toast.success(`File PDF ${docKey.toUpperCase()} "${file.name}" berhasil di-upload & diterbitkan!`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAdminFileDelete = (jamaahId: string, docKey: 'tiket' | 'visa' | 'polis') => {
    setConfirmModal({
      isOpen: true,
      title: `Hapus File ${docKey.toUpperCase()}`,
      message: `Apakah Anda yakin ingin menghapus file PDF ${docKey.toUpperCase()} yang telah diupload?`,
      type: 'danger',
      onConfirm: () => {
        const updated = jamaahList.map((j) => {
          if (j.id === jamaahId) {
            const currentFiles = { ...(j.docFiles || {}) };
            delete currentFiles[docKey];
            return {
              ...j,
              docFiles: currentFiles
            };
          }
          return j;
        });
        setJamaahList(updated);
        saveAndSyncState(updated);
        toast.info(`File PDF ${docKey.toUpperCase()} berhasil dihapus.`);
      }
    });
  };

  const handleDownloadBase64 = (dataUrl: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Mengunduh file PDF: ${fileName}`);
    } catch (err) {
      toast.error('Gagal mengunduh file.');
    }
  };

  const handleDeleteJamaah = (id: string, userName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Data Jamaah',
      message: `Apakah Anda yakin ingin menghapus data jamaah ${userName} dari portal admin? Semua berkas terkait jemaah ini akan terhapus.`,
      type: 'danger',
      onConfirm: () => {
        const updated = jamaahList.filter((j) => j.id !== id);
        saveAndSyncState(updated);
        toast.success(`Data jamaah ${userName} telah dihapus dari Portal Admin.`);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* SUMMARY STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-950 text-white rounded-[2rem] p-5 shadow-lg border border-emerald-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-emerald-900/50">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Total Jamaah Terdaftar</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-playfair">{filteredJamaahList.length}</span>
            <span className="text-xs font-bold text-emerald-400">Pusat Data</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-amber-50">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Menunggu Verifikasi</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-playfair">{jamaahList.filter(j => j.statusBiodata !== 'verified' && j.paxCount !== 9 && j.jumlahPax !== 9).length}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black uppercase">Segera Review</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-emerald-50">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sudah Terverifikasi</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-playfair">{jamaahList.filter(j => j.statusBiodata === 'verified' && j.paxCount !== 9 && j.jumlahPax !== 9).length}</span>
            <span className="text-xs font-bold text-emerald-600 font-mono">READY</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-blue-50">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mitra Aktif Berkontribusi</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-playfair">{activeMitraCount}</span>
            <span className="text-xs font-bold text-blue-600 uppercase">Mitra</span>
          </div>
        </div>
      </div>
      
      {/* HEADER & SUB-TABS */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest border border-emerald-200 mb-1">
            <Users className="w-3.5 h-3.5 text-emerald-700" /> PORTAL ADMIN - MITRA & JAMAAH BINAAN
          </div>
          <h2 className="text-2xl font-playfair font-bold text-slate-900 tracking-tight">
            Pusat Pengelolaan Calon Jamaah Mitra
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Verifikasi biodata paspor, berkas lampiran, dan siklus pendaftaran jamaah binaan mitra secara langsung.
          </p>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setViewMode('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                viewMode === 'dashboard' ? 'bg-white text-emerald-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard Mitra
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                viewMode === 'list' ? 'bg-white text-emerald-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Scroll className="w-3.5 h-3.5" /> Daftar Lengkap
            </button>
          </div>

          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto max-w-full">
          <button
            onClick={() => {
              setCurrentTab('biodata');
              setActiveDokumenJemaah(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'biodata' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Biodata & Paspor
          </button>
          <button
            onClick={() => {
              setCurrentTab('dokumen');
              setActiveDokumenJemaah(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'dokumen' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Verifikasi Dokumen
          </button>
          <button
            onClick={() => {
              setCurrentTab('pembayaran');
              setActiveDokumenJemaah(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'pembayaran' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pembayaran
          </button>
          <button
            onClick={() => {
              setCurrentTab('persiapan');
              setActiveDokumenJemaah(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'persiapan' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Perlengkapan
          </button>
          <button
            onClick={() => {
              setCurrentTab('dokumen_keberangkatan');
              setActiveDokumenJemaah(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'dokumen_keberangkatan' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dok. Keberangkatan
          </button>
        </div>
      </div>
    </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Manifest Download Button */}
          <button
            onClick={() => {
              if (filteredJamaahList.length === 0) {
                toast.error('Tidak ada data jamaah untuk diunduh.');
                return;
              }
              generateManifestPdf(filteredJamaahList, selectedMitraFilter);
              toast.success(`Manifest ${filteredJamaahList.length} jamaah berhasil diunduh!`);
            }}
            className="px-4 py-2 bg-emerald-950 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-slate-900 transition-all shadow-sm border border-emerald-800/30 shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" /> Unduh Manifest (PDF)
          </button>

          {/* Mitra Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedMitraFilter}
                onChange={(e) => setSelectedMitraFilter(e.target.value)}
                className="bg-slate-50 text-slate-900 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 w-full appearance-none pr-10 shadow-sm"
              >
                <option value="all">Semua Mitra Penanggung Jawab</option>
                {mitras.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, NIK, paspor, mitra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium self-end md:self-auto">
          Menampilkan <strong className="text-emerald-900 font-bold">{filteredJamaahList.length} Jamaah</strong>
        </div>
      </div>

      {/* DASHBOARD VIEW: GROUPED BY MITRA TABLE */}
      {viewMode === 'dashboard' && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-3xl bg-emerald-950 text-white shadow-xl border border-emerald-800">
                <LayoutDashboard className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 font-playfair tracking-tight">Ringkasan Kontribusi Mitra</h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Rekapitulasi Akumulasi Pendaftaran Jamaah Per Mitra</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100 flex items-center gap-2.5 shadow-sm">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-black uppercase text-emerald-900 tracking-wider">{activeMitraCount} Mitra Aktif</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-[2rem] shadow-inner">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.25em]">
                  <th className="py-6 px-8">Informasi & ID Mitra</th>
                  <th className="py-6 px-8 text-center">Total Jamaah</th>
                  <th className="py-6 px-8 text-center">Verifikasi</th>
                  <th className="py-6 px-8 text-center">Menunggu Review</th>
                  <th className="py-6 px-8 text-center">Progress</th>
                  <th className="py-6 px-8 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium">
                {mitras.map(mitra => {
                  const stats = mitraStats[mitra.id] || 
                                mitraStats[(mitra.id || '').toLowerCase().trim()] || 
                                mitraStats[mitra.baseName] || 
                                mitraStats[(mitra.baseName || '').toLowerCase().trim()] || 
                                mitraStats[mitra.email] || 
                                mitraStats[(mitra.email || '').toLowerCase().trim()] || 
                                mitraStats[mitra.name] || 
                                { total: 0, unverified: 0, verified: 0, totalPax: 0, recentJamaah: [] };
                  const progress = stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0;

                  return (
                    <tr 
                      key={mitra.id} 
                      className="group hover:bg-slate-50/90 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedMitraFilter(mitra.id);
                        setViewMode('list');
                      }}
                    >
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-[1.25rem] bg-emerald-50 flex items-center justify-center text-emerald-700 font-black text-xl border border-emerald-100 group-hover:bg-emerald-100 transition-colors shadow-sm">
                            {mitra.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-base font-black text-slate-900 leading-tight group-hover:text-emerald-900 transition-colors">{mitra.name}</p>
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 shadow-sm">
                                <ShieldCheck className="w-3 h-3" />
                                <span className="text-[8px] font-black uppercase tracking-tighter whitespace-nowrap">Verified</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{mitra.id}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Penanggung Jawab</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-center">
                        <div className="space-y-0.5">
                          <span className="text-xl font-black text-slate-900 font-playfair">{stats.total}</span>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jamaah Input</p>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-center">
                        <div className="flex flex-col items-center">
                          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200 shadow-sm">
                            {stats.verified} Verified
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black border transition-all shadow-sm ${
                            stats.unverified > 0 
                            ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            {stats.unverified} Review
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <div className="w-40 mx-auto space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status Verifikasi</span>
                            <span className="text-[10px] font-black text-emerald-700">{progress}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                            <div 
                              className="h-full bg-emerald-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(5,150,105,0.4)]" 
                              style={{ width: `${progress}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-right">
                        <button className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-emerald-900 transition-all shadow-lg active:scale-95 group-hover:translate-x-[-4px]">
                          <Eye className="w-4 h-4" /> Buka Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 1: BIODATA & PASPOR TABLE FOR ADMIN */}
      {currentTab === 'biodata' && viewMode === 'list' && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-playfair font-bold text-slate-900 text-xl">
                Daftar Calon Jamaah - Biodata & Paspor RI
              </h3>
              <p className="text-xs text-slate-500">
                Berikut adalah kolom lengkap data biodata, NIK, paspor, dan mitra penanggung jawab jamaah.
              </p>
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                  <th className="py-4 px-4">ID & Tgl Register</th>
                  <th className="py-4 px-4">Nama Jamaah & NIK</th>
                  <th className="py-4 px-4">Mitra Penanggung Jawab</th>
                  <th className="py-4 px-4">Paket & Pax Rombongan</th>
                  <th className="py-4 px-4">No. Telepon / WA</th>
                  <th className="py-4 px-4">Data Paspor RI</th>
                  <th className="py-4 px-4">Status Verifikasi</th>
                  <th className="py-4 px-4 text-center">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredJamaahList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      <div className="max-w-md mx-auto space-y-2">
                        <Users className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-sm font-bold text-slate-600">Belum Ada Data Calon Jemaah</p>
                        <p className="text-xs text-slate-400">
                          Mitra belum menginput data calon jemaah binaan. Data akan otomatis muncul setelah Mitra mengisi formulir pendaftaran.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredJamaahList.map((j) => {
                    const isVerified = j.statusBiodata === 'verified';
                    return (
                      <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-black text-slate-900 block">{j.id}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{j.registeredAt}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-900 block text-sm">{j.userName}</span>
                          <span className="text-[10px] font-mono text-slate-500 block">NIK: {j.nik}</span>
                          {(() => {
                            const med = j.riwayatMedisPenyakit || j.medicalConditions || j.riwayatMedis || j.medicalHistory;
                            const isHealthy = !med || med === 'Sehat / Tidak ada' || med === "Sehat Wal'afiat" || (Array.isArray(med) && (med.length === 0 || (med.length === 1 && med[0] === 'Sehat / Tidak ada')));
                            const textDisplay = Array.isArray(med) ? med.join(', ') : String(med || 'Sehat');
                            return (
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 border ${
                                isHealthy
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}>
                                <Activity className="w-2.5 h-2.5 text-rose-600" />
                                {isHealthy ? 'Sehat' : textDisplay}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-bold text-emerald-900 block">{j.mitraName}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-extrabold text-slate-800 block truncate max-w-[180px]">{j.packageName}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                            <Users className="w-3 h-3 text-emerald-600" /> {j.paxCount} Pax Rombongan
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-800">
                          {j.userPhone}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-900 block font-mono">{j.pasporNo || 'Belum Diisi'}</span>
                          <span className="text-[10px] text-slate-400">Exp: {j.pasporTglExpired || j.pasporExpired || '-'}</span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleVerifyBiodata(j.id)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all ${
                              isVerified
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                            }`}
                          >
                            {isVerified ? 'VERIFIED' : 'PENDING'}
                          </button>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedJamaahForDetail(j)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition-colors"
                              title="Lihat Detail & Edit"
                            >
                              <Eye className="w-4 h-4 text-emerald-700" />
                            </button>
                            <button
                              onClick={() => {
                                generateRegistrationFormPdf(j);
                                toast.success(`Formulir PDF ${j.userName} berhasil diunduh!`);
                              }}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 transition-colors"
                              title="Cetak PDF Formulir"
                            >
                              <Download className="w-4 h-4 text-amber-600" />
                            </button>
                            <a
                              href={`https://wa.me/${(j.userPhone || j.phone || j.noHp || j.hp || '').toString().replace(/^0/, '62')}?text=Assalamu'alaikum%20Bapak/Ibu%20${encodeURIComponent(j.userName || 'Jamaah')},%20mengenai%20pendaftaran%20paket%20${encodeURIComponent(j.packageName || 'Umroh')}...`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors"
                              title="Hubungi via WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4 text-emerald-600" />
                            </a>
                            <button
                              onClick={() => handleDeleteJamaah(j.id, j.userName)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                              title="Hapus Data Jamaah Ini"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: UNGGAH DOKUMEN */}
      {currentTab === 'dokumen' && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
          {!activeDokumenJemaah ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-playfair font-bold text-slate-900 text-xl">Verifikasi Dokumen Syarat Jamaah</h3>
                  <p className="text-xs text-slate-500">Pilih jemaah untuk memeriksa berkas lampiran yang diunggah.</p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-4 px-6">Nama Jamaah</th>
                      <th className="py-4 px-6">Mitra</th>
                      <th className="py-4 px-6 text-center">Status Berkas</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {filteredJamaahList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                          Belum ada jemaah yang mengisi biodata.
                        </td>
                      </tr>
                    ) : (
                      filteredJamaahList.map((j) => {
                        const docs = j.documents || {};
                        const docCount = Object.keys(docs).length;
                        const pendingCount = Object.values(docs).filter((d: any) => d.status === 'pending').length;
                        const verifiedCount = Object.values(docs).filter((d: any) => d.status === 'verified').length;

                        return (
                          <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-6">
                              <span className="font-bold text-slate-900 block">{j.userName}</span>
                              <span className="text-[10px] text-slate-400">{j.nik}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-medium text-slate-600">{j.mitraName}</span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {docCount === 0 ? (
                                  <span className="text-[10px] text-slate-400 italic">Belum ada unggahan</span>
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold">
                                      {docCount} Total
                                    </span>
                                    {pendingCount > 0 && (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold">
                                        {pendingCount} Pending
                                      </span>
                                    )}
                                    {verifiedCount > 0 && (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                                        {verifiedCount} OK
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => setActiveDokumenJemaah(j)}
                                className="px-4 py-2 bg-emerald-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-800 transition-all flex items-center gap-2 ml-auto shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5" /> Preview & Verifikasi
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveDokumenJemaah(null)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                    title="Kembali ke Daftar"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="font-playfair font-bold text-slate-900 text-xl">
                      Review Dokumen: {activeDokumenJemaah.userName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Mitra: {activeDokumenJemaah.mitraName} | {activeDokumenJemaah.packageName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadZip}
                    className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-200 transition-all flex items-center gap-2 border border-emerald-200 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Semua (ZIP)
                  </button>
                  <button
                    onClick={() => setActiveDokumenJemaah(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                  >
                    Kembali ke Daftar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { key: 'ktp', label: 'KTP Asli' },
                  { key: 'kk', label: 'Kartu Keluarga' },
                  { key: 'paspor', label: 'Paspor RI' },
                  { key: 'foto', label: 'Pas Foto 4x6' },
                  { key: 'buku_nikah', label: 'Buku Nikah / Akta', show: activeDokumenJemaah.statusPernikahan === 'Menikah' }
                ].filter(d => d.show !== false).map((docInfo) => {
                  const docKey = docInfo.key;
                  const docVal = activeDokumenJemaah.documents?.[docKey];
                  
                  return (
                    <div key={docKey} className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4 flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[10px] text-slate-900 uppercase tracking-widest">{docInfo.label}</span>
                        {docVal?.status === 'verified' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> VERIFIED
                          </span>
                        ) : docVal?.status === 'pending' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        ) : docVal?.status === 'rejected' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-300 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> REJECTED
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-500 text-[10px] font-black border border-slate-300">
                            EMPTY
                          </span>
                        )}
                      </div>

                      <div className="h-48 bg-slate-200 rounded-2xl overflow-hidden flex items-center justify-center relative group border border-slate-300">
                        {docVal?.url ? (
                          <>
                            {docVal.fileType === 'application/pdf' || docVal.url.toLowerCase().endsWith('.pdf') ? (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 gap-2 px-4">
                                <div className="w-12 h-14 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center shadow-sm">
                                  <div className="text-[10px] font-black text-red-600 mb-0.5">PDF</div>
                                  <FileText className="w-6 h-6 text-red-600" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 truncate w-full text-center">
                                  {docVal.fileName || 'Dokumen PDF'}
                                </span>
                              </div>
                            ) : (
                              <img src={docVal.url} alt={docKey} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <a href={docVal.url} target="_blank" rel="noreferrer" className="p-2 bg-white rounded-xl shadow-lg">
                                <Eye className="w-5 h-5 text-slate-900" />
                              </a>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="w-8 h-8 text-slate-400" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Belum Diunggah</span>
                          </div>
                        )}
                      </div>

                      {docVal?.url && (
                        <div className="grid grid-cols-2 gap-2 pt-2 mt-auto">
                          <button
                            onClick={() => handleRejectDoc(docKey)}
                            disabled={docVal.status === 'rejected'}
                            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${
                              docVal.status === 'rejected'
                                ? 'bg-rose-50 text-rose-300 border-rose-100 cursor-not-allowed'
                                : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                          <button
                            onClick={() => handleApproveDoc(docKey)}
                            disabled={docVal.status === 'verified'}
                            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${
                              docVal.status === 'verified'
                                ? 'bg-emerald-50 text-emerald-400 border-emerald-100 cursor-not-allowed'
                                : 'bg-emerald-900 text-white border-emerald-900 hover:bg-emerald-800 shadow-md active:scale-95'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: PEMBAYARAN */}
      {currentTab === 'pembayaran' && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
            <div>
              <h3 className="font-playfair font-bold text-slate-900 text-3xl">Manajemen Keuangan Jemaah</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-lg">Pantau arus kas, verifikasi setoran, dan kelola pelunasan paket dari seluruh binaan mitra secara real-time.</p>
              
              {/* SUB-TABS */}
              <div className="flex items-center gap-2 mt-6 p-1.5 bg-slate-50 rounded-2xl border border-slate-100 w-fit flex-wrap">
                <button
                  onClick={() => setPaymentSubTab('individual')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                    paymentSubTab === 'individual' 
                      ? 'bg-white text-emerald-900 shadow-sm border border-slate-200' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    KELOLA PER JEMAAH
                  </div>
                </button>
                <button
                  onClick={() => setPaymentSubTab('rekap')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                    paymentSubTab === 'rekap' 
                      ? 'bg-white text-emerald-900 shadow-sm border border-slate-200' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" />
                    REKAP MITRA TERPILIH
                  </div>
                </button>
                <button
                  onClick={() => setPaymentSubTab('rekap_all')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                    paymentSubTab === 'rekap_all' 
                      ? 'bg-emerald-900 text-white shadow-md border border-emerald-900' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    REKAP TRANSAKSI KESELURUHAN MITRA
                  </div>
                </button>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <button
                onClick={handleExportPayments}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 font-black text-xs rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                UNDUH LAPORAN (PDF)
              </button>
              
              {paymentSubTab === 'individual' && filteredJamaahList.length > 0 && (
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 text-right">Pilih Jemaah Aktif</span>
                  <select
                    value={selectedJamaahIdx}
                    onChange={(e) => setSelectedJamaahIdx(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer pr-10 min-w-[280px] shadow-inner"
                  >
                    {filteredJamaahList.map((j, idx) => (
                      <option key={j.id} value={idx}>
                        {j.userName} — {j.packageName || 'Belum Pilih Paket'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {paymentSubTab === 'rekap_all' ? (
            <div className="space-y-6">
              {/* FINANSIAL SUMMARY CARDS FOR ALL MITRAS */}
              {(() => {
                const allGlobalPayments = jamaahList.flatMap((j) =>
                  (j.payments || []).map((p: any, pIdx: number) => ({
                    ...p,
                    pIdx,
                    jamaahName: j.userName,
                    jamaahId: j.id,
                    packageName: j.packageName || 'Paket Umrah',
                    mitraName: j.mitraName || j.ordererName || 'Mitra Travel',
                    mitraEmail: j.mitraEmail || j.ordererEmail || ''
                  }))
                ).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

                const verifiedPayments = allGlobalPayments.filter(p => ['verified', 'approved', 'VERIFIED'].includes(p.status));
                const pendingPayments = allGlobalPayments.filter(p => p.status === 'pending');
                const totalVerifiedNominal = verifiedPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
                const totalPendingNominal = pendingPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

                const filteredGlobal = allGlobalPayments.filter((p) => {
                  if (rekapStatusFilter === 'pending' && p.status !== 'pending') return false;
                  if (rekapStatusFilter === 'verified' && !['verified', 'approved', 'VERIFIED'].includes(p.status)) return false;
                  if (rekapStatusFilter === 'rejected' && p.status !== 'rejected') return false;

                  if (rekapSearchQuery.trim() !== '') {
                    const q = rekapSearchQuery.toLowerCase();
                    const matchJemaah = (p.jamaahName || '').toLowerCase().includes(q);
                    const matchId = (p.jamaahId || '').toLowerCase().includes(q);
                    const matchMitra = (p.mitraName || '').toLowerCase().includes(q);
                    const matchEmail = (p.mitraEmail || '').toLowerCase().includes(q);
                    const matchBank = (p.bank || '').toLowerCase().includes(q);
                    return matchJemaah || matchId || matchMitra || matchEmail || matchBank;
                  }
                  return true;
                });

                return (
                  <>
                    {/* STATS OVERVIEW */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-sm border border-emerald-800">
                        <span className="text-emerald-200 text-[10px] font-black uppercase tracking-widest block mb-1">Total Setoran Verified</span>
                        <p className="text-2xl font-black">Rp {totalVerifiedNominal.toLocaleString('id-ID')}</p>
                        <span className="text-[10px] text-emerald-300 font-medium mt-1 block">{verifiedPayments.length} transaksi disetujui</span>
                      </div>

                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block mb-1">Total Transaksi Masuk</span>
                        <p className="text-2xl font-black text-slate-900">{allGlobalPayments.length} <span className="text-sm font-bold text-slate-500">Transaksi</span></p>
                        <span className="text-[10px] text-slate-400 font-medium mt-1 block">Dari seluruh jemaah semua mitra</span>
                      </div>

                      <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm">
                        <span className="text-amber-700 text-[10px] font-black uppercase tracking-widest block mb-1">Menunggu Verifikasi</span>
                        <p className="text-2xl font-black text-amber-900">Rp {totalPendingNominal.toLocaleString('id-ID')}</p>
                        <span className="text-[10px] text-amber-600 font-medium mt-1 block">{pendingPayments.length} transaksi pending</span>
                      </div>

                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block mb-1">Total Jemaah & Mitra</span>
                        <p className="text-2xl font-black text-slate-900">{jamaahList.length} <span className="text-sm font-bold text-slate-500">Jemaah</span></p>
                        <span className="text-[10px] text-slate-400 font-medium mt-1 block">Dari {mitras.length} Mitra Penanggung Jawab</span>
                      </div>
                    </div>

                    {/* SEARCH & FILTER TOOLBAR */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={rekapSearchQuery}
                          onChange={(e) => setRekapSearchQuery(e.target.value)}
                          placeholder="Cari nama jemaah, mitra, ID, bank..."
                          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 transition-all shadow-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                          value={rekapStatusFilter}
                          onChange={(e) => setRekapStatusFilter(e.target.value as any)}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 transition-all cursor-pointer shadow-sm"
                        >
                          <option value="all">Semua Status Transaksi</option>
                          <option value="pending">Menunggu Verifikasi</option>
                          <option value="verified">Verified / Disetujui</option>
                          <option value="rejected">Ditolak</option>
                        </select>
                      </div>
                    </div>

                    {/* GLOBAL TABLE */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Jemaah</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mitra Penanggung Jawab</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Waktu</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nominal</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Bank</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Bukti</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Status & Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredGlobal.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold text-xs italic">
                                Tidak ada data riwayat transaksi ditemukan.
                              </td>
                            </tr>
                          ) : (
                            filteredGlobal.map((payment: any, idx: number) => (
                              <tr key={payment.id || idx} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                  <p className="text-xs font-black text-slate-900">{payment.jamaahName}</p>
                                  <p className="text-[9px] text-slate-400 font-medium">ID: {payment.jamaahId}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-xs font-bold text-emerald-800">{payment.mitraName}</p>
                                  {payment.mitraEmail && <p className="text-[9px] text-slate-400">{payment.mitraEmail}</p>}
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-[10px] font-bold text-slate-700">{payment.date || '-'}</p>
                                  <p className="text-[9px] text-slate-400">{payment.time || '-'}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-xs font-black text-emerald-700">Rp {Number(payment.amount).toLocaleString('id-ID')}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">{payment.step || payment.stage || 'DP'}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                                      <Building2 className="w-3 h-3 text-blue-600" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-600 uppercase">{payment.bank || 'Mandiri'}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  {(payment.proofUrl || payment.receiptUrl) ? (
                                    <button 
                                      onClick={() => setSelectedProof(payment.proofUrl || payment.receiptUrl)}
                                      className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 hover:bg-emerald-100 transition-all shadow-sm"
                                      title="Pratinjau Bukti"
                                    >
                                      <FileText className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 opacity-30">
                                      <AlertCircle className="w-4 h-4" />
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {payment.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => handleVerifyRejectPayment(payment, true)}
                                          className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
                                          title="Verifikasi Pembayaran"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleVerifyRejectPayment(payment, false)}
                                          className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm"
                                          title="Tolak Pembayaran"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}
                                    <button 
                                      onClick={() => handleDownloadReceipt({ userName: payment.jamaahName, id: payment.jamaahId }, payment)}
                                      className="p-1.5 bg-white text-slate-400 hover:text-emerald-600 rounded-lg border border-slate-200 hover:bg-emerald-50 transition-all"
                                      title="Cetak Kuitansi"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeletePayment(payment.jamaahId, payment.id || payment.pIdx?.toString())}
                                      className="p-1.5 bg-white text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 hover:bg-red-50 transition-all"
                                      title="Hapus Riwayat"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black tracking-wider uppercase border ${
                                      ['verified', 'approved', 'VERIFIED'].includes(payment.status) 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                        : payment.status === 'rejected'
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                      {payment.status === 'pending' ? 'MENUNGGU' : payment.status.toUpperCase()}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : filteredJamaahList.length === 0 ? (
            <div className="p-16 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-base font-bold text-slate-600">Belum Ada Data Keuangan</p>
              <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">Mitra belum mendaftarkan jemaah atau transaksi belum tersedia.</p>
            </div>
          ) : paymentSubTab === 'individual' ? (
            <>
              {/* INDIVIDUAL VIEW (METRICS ROW) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-emerald-200 transition-all">
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block mb-2">Total Biaya Paket</span>
                  <p className="text-2xl font-black text-slate-900">Rp {(Number(selectedJamaah.packagePrice || selectedJamaah.totalPrice || 0)).toLocaleString('id-ID')}</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium italic">{selectedJamaah.packageName || 'Belum pilih paket'}</p>
                </div>
                
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm group hover:border-emerald-300 transition-all">
                  <span className="text-emerald-700 text-[10px] font-black uppercase tracking-widest block mb-2">Total Terbayar</span>
                  <p className="text-2xl font-black text-emerald-900">
                    Rp {(selectedJamaah.payments?.filter((p: any) => ['verified', 'approved', 'VERIFIED'].includes(p.status)).reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0).toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-1 font-medium">Dana Masuk & Terverifikasi</p>
                </div>

                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 shadow-sm group hover:border-blue-300 transition-all">
                  <span className="text-blue-700 text-[10px] font-black uppercase tracking-widest block mb-2">Sisa Pelunasan</span>
                  <p className="text-2xl font-black text-blue-900">
                    Rp {(Math.max(0, (Number(selectedJamaah.packagePrice || selectedJamaah.totalPrice || 0)) - (selectedJamaah.payments?.filter((p: any) => ['verified', 'approved', 'VERIFIED'].includes(p.status)).reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0))).toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-blue-600 mt-1 font-medium">Batas Waktu: H-30 Berangkat</p>
                </div>

                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm group hover:border-amber-300 transition-all flex flex-col justify-between">
                  <div>
                    <span className="text-amber-700 text-[10px] font-black uppercase tracking-widest block mb-2">Tahapan Saat Ini</span>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black tracking-widest shadow-sm">
                        {(() => {
                          const paid = selectedJamaah.payments?.filter((p: any) => ['verified', 'approved', 'VERIFIED'].includes(p.status)).reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
                          const total = Number(selectedJamaah.packagePrice || selectedJamaah.totalPrice || 0);
                          if (paid >= total && total > 0) return 'LUNAS';
                          if (paid >= total * 0.5) return 'DP2';
                          return 'DP1';
                        })()}
                      </span>
                    </div>
                  </div>
                  {selectedJamaah.payments?.some((p: any) => p.status === 'pending') && (
                    <div className="mt-2 flex items-center gap-1.5 text-amber-600 animate-pulse">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase">Ada Verifikasi Pending</span>
                    </div>
                  )}
                </div>
              </div>

              {/* PAYMENT LIST / PROOF VERIFICATION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Scroll className="w-4 h-4 text-emerald-700" /> Riwayat Transaksi & Bukti Bayar
                  </h4>
                  <div className="text-[10px] font-bold text-slate-400 italic">
                    ID Jemaah: <span className="text-slate-900 font-black">{selectedJamaah.id}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Waktu Transaksi</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tahap</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nominal</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Bukti Transfer</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(!selectedJamaah.payments || selectedJamaah.payments.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold text-xs italic">
                            Belum ada riwayat transaksi yang diunggah oleh mitra.
                          </td>
                        </tr>
                      ) : (
                        selectedJamaah.payments.map((payment: any, pIdx: number) => (
                          <tr key={payment.id || pIdx} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                              <p className="text-xs font-bold text-slate-900">{payment.date || '-'}</p>
                              <p className="text-[10px] text-slate-400">Pukul {payment.time || '-'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase">
                                {payment.step || 'DP'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-black text-slate-900">Rp {Number(payment.amount).toLocaleString('id-ID')}</p>
                              <p className="text-[10px] text-blue-600 font-bold uppercase">{payment.bank || 'Mandiri'}</p>
                            </td>
                            <td className="px-6 py-4">
                              {(payment.proofUrl || payment.receiptUrl) ? (
                                <div className="flex flex-col gap-2">
                                  <button 
                                    onClick={() => setSelectedProof(payment.proofUrl || payment.receiptUrl)}
                                    className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-black text-[10px] uppercase group bg-emerald-50/50 p-2 rounded-xl border border-emerald-100 transition-all hover:bg-emerald-100"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                      <div className="block">Pratinjau Bukti</div>
                                      <div className="text-[8px] opacity-60 normal-case">Klik untuk memperbesar</div>
                                    </div>
                                  </button>
                                  <a 
                                    href={payment.proofUrl || payment.receiptUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[9px] text-slate-400 hover:text-slate-600 underline ml-2 font-bold"
                                  >
                                    Buka di Tab Baru
                                  </a>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                    <AlertCircle className="w-4 h-4 opacity-30" />
                                  </div>
                                  <span className="text-[10px] font-bold uppercase italic">Tidak Ada Bukti</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                                ['verified', 'approved', 'VERIFIED'].includes(payment.status) 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : payment.status === 'rejected'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {payment.status === 'pending' ? 'MENUNGGU' : payment.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {payment.status === 'pending' ? (
                                  <>
                                    <button
                                      onClick={() => handleVerifyRejectPayment({ ...payment, pIdx }, true, selectedJamaah.id)}
                                      className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm"
                                      title="Verifikasi Pembayaran"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleVerifyRejectPayment({ ...payment, pIdx }, false, selectedJamaah.id)}
                                      className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-sm"
                                      title="Tolak Pembayaran"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    onClick={() => handleDownloadReceipt(selectedJamaah, payment)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 font-bold text-[9px] rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-all border border-slate-200"
                                  >
                                    <Download className="w-3 h-3" />
                                    CETAK
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleDeletePayment(selectedJamaah.id, payment.id || pIdx.toString())}
                                  className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200"
                                  title="Hapus Transaksi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* QUICK ACTION BANNER */}
                <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-amber-400 tracking-widest">Otorisasi Pembayaran</p>
                      <p className="text-[10px] text-slate-400 font-medium max-w-sm">Tandai jemaah ini sebagai LUNAS SEPENUHNYA jika seluruh verifikasi manual telah selesai.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleApprovePayment}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2"
                  >
                    Setujui Pelunasan Final
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {/* REKAP VIEW */}
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-700" /> Ringkasan Seluruh Transaksi Mitra
                </h4>
                <div className="px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                  Total {filteredJamaahList.reduce((acc, j) => acc + (j.payments?.length || 0), 0)} Transaksi
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Jemaah</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mitra Penanggung Jawab</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Waktu</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nominal</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Bank</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Bukti</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Status & Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredJamaahList.flatMap((j) => (j.payments || []).map((p: any, pIdx: number) => ({
                      ...p,
                      pIdx,
                      jamaahName: j.userName,
                      jamaahId: j.id,
                      mitraName: j.mitraName || j.ordererName || 'Mitra Travel',
                      mitraEmail: j.mitraEmail || j.ordererEmail || ''
                    }))).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold text-xs italic">
                          Tidak ada data transaksi masuk dari mitra ini.
                        </td>
                      </tr>
                    ) : (
                      filteredJamaahList.flatMap((j) => (j.payments || []).map((p: any, pIdx: number) => ({
                        ...p,
                        pIdx,
                        jamaahName: j.userName,
                        jamaahId: j.id,
                        mitraName: j.mitraName || j.ordererName || 'Mitra Travel',
                        mitraEmail: j.mitraEmail || j.ordererEmail || ''
                      })))
                        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
                        .map((payment: any, idx: number) => (
                          <tr key={payment.id || idx} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                              <p className="text-xs font-black text-slate-900">{payment.jamaahName}</p>
                              <p className="text-[9px] text-slate-400 font-medium">ID: {payment.jamaahId}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-bold text-emerald-800">{payment.mitraName}</p>
                              {payment.mitraEmail && <p className="text-[9px] text-slate-400">{payment.mitraEmail}</p>}
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-[10px] font-bold text-slate-700">{payment.date || '-'}</p>
                              <p className="text-[9px] text-slate-400">{payment.time || '-'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-black text-emerald-700">Rp {Number(payment.amount).toLocaleString('id-ID')}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{payment.step || 'DP'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                                  <Building2 className="w-3 h-3 text-blue-600" />
                                </div>
                                <span className="text-[10px] font-black text-slate-600 uppercase">{payment.bank || 'Mandiri'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {(payment.proofUrl || payment.receiptUrl) ? (
                                <button 
                                  onClick={() => setSelectedProof(payment.proofUrl || payment.receiptUrl)}
                                  className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 hover:bg-emerald-100 transition-all shadow-sm"
                                  title="Pratinjau Bukti"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 opacity-30">
                                  <AlertCircle className="w-4 h-4" />
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {payment.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleVerifyRejectPayment(payment, true)}
                                      className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
                                      title="Verifikasi Pembayaran"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleVerifyRejectPayment(payment, false)}
                                      className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm"
                                      title="Tolak Pembayaran"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                <button 
                                  onClick={() => handleDownloadReceipt({ userName: payment.jamaahName, id: payment.jamaahId }, payment)}
                                  className="p-1.5 bg-white text-slate-400 hover:text-emerald-600 rounded-lg border border-slate-200 hover:bg-emerald-50 transition-all"
                                  title="Cetak Kuitansi"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeletePayment(payment.jamaahId, payment.id || payment.pIdx?.toString())}
                                  className="p-1.5 bg-white text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 hover:bg-red-50 transition-all"
                                  title="Hapus Riwayat"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black tracking-wider uppercase border ${
                                  ['verified', 'approved', 'VERIFIED'].includes(payment.status) 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : payment.status === 'rejected'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {payment.status === 'pending' ? 'MENUNGGU' : payment.status.toUpperCase()}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: PERSIAPAN KEBERANGKATAN */}
      {currentTab === 'persiapan' && (
        <div className="space-y-6">
          {/* Top Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Calon Jemaah</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{filteredJamaahList.length} Jamaah</div>
                <div className="text-[11px] font-medium text-slate-500 mt-0.5">Seluruh Binaan Mitra</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold shrink-0">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Koper & Tas Travel</div>
                <div className="text-2xl font-black text-emerald-800 mt-1">
                  {filteredJamaahList.filter(j => (j.equipment?.koper ?? j.equipment?.koperTas)).length}/{filteredJamaahList.length}
                </div>
                <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                  {filteredJamaahList.length > 0 ? Math.round((filteredJamaahList.filter(j => (j.equipment?.koper ?? j.equipment?.koperTas)).length / filteredJamaahList.length) * 100) : 0}% Terdistribusi
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 font-bold shrink-0">
                <Luggage className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ihram / Mukena Syar'i</div>
                <div className="text-2xl font-black text-emerald-800 mt-1">
                  {filteredJamaahList.filter(j => (j.equipment?.ihram ?? j.equipment?.kainIhram)).length}/{filteredJamaahList.length}
                </div>
                <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                  Sesuai Gender (L/P)
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 font-bold shrink-0 text-xl">
                🕋
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Seragam Batik & Doa</div>
                <div className="text-2xl font-black text-emerald-800 mt-1">
                  {filteredJamaahList.filter(j => (j.equipment?.batik ?? j.equipment?.seragamBatik)).length}/{filteredJamaahList.length}
                </div>
                <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                  Kain Batik & Buku Doa
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-800 font-bold shrink-0 text-xl">
                👔
              </div>
            </div>
          </div>

          {/* MAIN CONTAINER FOR PERSIAPAN PERLENGKAPAN */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6">
            {/* Header & Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="font-playfair font-bold text-slate-900 text-xl flex items-center gap-2">
                  <Luggage className="w-6 h-6 text-emerald-800" />
                  Penyerahan Perlengkapan Calon Jemaah Mitra
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola distribusi fisik Koper, Kain Ihram (Laki-laki) / Mukena Syar'i (Perempuan), dan Batik Jamaah secara real-time.
                </p>
              </div>

              {/* Action Button for PDF */}
              <button
                onClick={handleDownloadAllEquipmentReport}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-amber-300 font-bold text-xs rounded-2xl shadow-md transition-all shrink-0 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" />
                UNDUH REKAP PERLENGKAPAN (PDF)
              </button>
            </div>

            {/* BAR INPUT PETUGAS ADMIN LOGISTIK PENANGGUNG JAWAB */}
            <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-amber-500/30 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                      INPUT PETUGAS ADMIN LOGISTIK
                    </span>
                    <span className="text-emerald-300 text-xs font-semibold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" /> Petugas Serah Terima Aktif
                    </span>
                  </div>
                  <h4 className="font-playfair font-bold text-lg text-white">Petugas Penanggung Jawab Penyerahan Barang</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Nama petugas yang diinput di bawah ini akan otomatis disematkan dan dicatat secara legal saat Anda menekan tombol ambil barang (Koper, Ihram/Mukena, Batik).
                  </p>
                </div>

                {/* Input Box */}
                <div className="w-full lg:w-96 shrink-0 space-y-1 bg-slate-900/60 p-3 rounded-2xl border border-emerald-500/30">
                  <label className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                    Ketik Nama Petugas Admin Logistik:
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                    <input
                      type="text"
                      value={activeOfficerName}
                      onChange={(e) => handleOfficerNameChange(e.target.value)}
                      placeholder="Contoh: Hj. Fatimah (Admin Logistik)"
                      className="w-full bg-slate-800 border border-emerald-500/50 rounded-xl pl-9 pr-3 py-2 text-xs font-black text-amber-300 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-800/60 text-xs">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Preset Nama Cepat:</span>
                {[
                  'Hj. Fatimah (Admin Logistik)',
                  'Ahmad Gudang Central',
                  'Siti Logistik & Perlengkapan',
                  'Ust. Hasan (Pemberangkatan)',
                  'Admin'
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleOfficerNameChange(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                      activeOfficerName === preset
                        ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                        : 'bg-emerald-950/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* RINGKASAN KONTRIBUSI MITRA & LOGISTIK JEMAAH BINAAN */}
            <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-amber-500/20 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase">
                      RESENSI KONTRIBUSI MITRA & LOGISTIK
                    </span>
                  </div>
                  <h3 className="font-playfair font-bold text-xl text-white mt-1 flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-400" />
                    Ringkasan Kontribusi Mitra pada Perlengkapan & Jemaah Binaan
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Total Jemaah Binaan Terdata</span>
                  <span className="text-2xl font-black text-amber-300">{filteredJamaahList.length} Jemaah</span>
                </div>
              </div>

              {/* Executive Review Text Box */}
              <div className="bg-slate-800/60 border border-emerald-500/30 rounded-2xl p-4 text-xs leading-relaxed space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Resensi Operasional Penyerahan Perlengkapan
                </div>
                <p className="text-slate-200">
                  Sampai saat ini, terdapat <strong className="text-white font-bold">{mitraContributionStats.length} Mitra Aktif</strong> yang telah merekrut dan membina total <strong className="text-white font-bold">{filteredJamaahList.length} Calon Jemaah</strong>. 
                  Status serah terima logistik fisik (Koper, Ihram/Mukena, & Batik) berada pada angka kepatuhan <strong className="text-amber-300 font-bold">
                    {filteredJamaahList.length > 0 ? Math.round((filteredJamaahList.filter(j => {
                      const eq = j.equipment || {};
                      return (eq.koper ?? eq.koperTas) && (eq.ihram ?? eq.kainIhram) && (eq.batik ?? eq.seragamBatik);
                    }).length / filteredJamaahList.length) * 100) : 0}% Tuntas Lengkap
                  </strong>. 
                  Seluruh pencatatan penyerahan barang diverifikasi sah di bawah wewenang Petugas Logistik Aktif: <span className="bg-emerald-900/80 px-2 py-0.5 rounded text-amber-300 font-black border border-amber-400/30">{activeOfficerName}</span>.
                </p>
              </div>

              {/* Table of Mitra Contributions */}
              <div className="overflow-x-auto rounded-2xl border border-emerald-800/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-950/90 text-amber-300 font-black text-[10px] uppercase tracking-wider border-b border-emerald-800/60">
                    <tr>
                      <th className="py-3 px-4">Nama Mitra Penanggung Jawab</th>
                      <th className="py-3 px-4 text-center">Jemaah Binaan</th>
                      <th className="py-3 px-4 text-center">🧳 Koper & Tas</th>
                      <th className="py-3 px-4 text-center">🕋 Ihram / Mukena</th>
                      <th className="py-3 px-4 text-center">👔 Seragam Batik</th>
                      <th className="py-3 px-4 text-center">Progres (%)</th>
                      <th className="py-3 px-4 text-right">Status Kontribusi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/50 bg-slate-900/40 text-slate-200">
                    {mitraContributionStats.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                          Belum ada data kontribusi mitra terdaftar.
                        </td>
                      </tr>
                    ) : (
                      mitraContributionStats.map((m, idx) => {
                        const totalItemsRequired = m.totalJamaah * 3;
                        const totalItemsTaken = m.koperCount + m.ihramCount + m.batikCount;
                        const pct = totalItemsRequired > 0 ? Math.round((totalItemsTaken / totalItemsRequired) * 100) : 0;
                        const isTuntas = m.completeCount === m.totalJamaah && m.totalJamaah > 0;

                        return (
                          <tr key={idx} className="hover:bg-emerald-950/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center text-[10px] font-black">
                                {idx + 1}
                              </span>
                              {m.mitraName}
                            </td>
                            <td className="py-3 px-4 text-center font-extrabold text-amber-300">
                              {m.totalJamaah} Orang
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                m.koperCount === m.totalJamaah ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {m.koperCount}/{m.totalJamaah}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                m.ihramCount === m.totalJamaah ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {m.ihramCount}/{m.totalJamaah}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                m.batikCount === m.totalJamaah ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {m.batikCount}/{m.totalJamaah}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                                  <div className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="text-[11px] font-black text-amber-300">{pct}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                isTuntas
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                                  : pct > 50
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                              }`}>
                                {isTuntas ? '✓ Penyerahan Tuntas' : pct > 50 ? '⌛ Sebagian Diambil' : '⚠️ Perlu Penyerahan'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Cari Nama / NIK / Mitra</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Filter Mitra</label>
                <select
                  value={selectedMitraFilter}
                  onChange={(e) => setSelectedMitraFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">Semua Mitra Penanggung Jawab</option>
                  {mitras.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Filter Jenis Kelamin</label>
                <select
                  value={equipmentGenderFilter}
                  onChange={(e) => setEquipmentGenderFilter(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">Semua Gender (L/P)</option>
                  <option value="L">👨 Laki-Laki (Pria)</option>
                  <option value="P">👩 Perempuan (Wanita)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Status Kelengkapan</label>
                <select
                  value={equipmentStatusFilter}
                  onChange={(e) => setEquipmentStatusFilter(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">Semua Kelengkapan</option>
                  <option value="complete">✓ Sudah Lengkap (100%)</option>
                  <option value="incomplete">⌛ Belum Lengkap (&lt;100%)</option>
                </select>
              </div>
            </div>

            {/* List of Calon Jamaah Cards / Items */}
            {filteredJamaahList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Luggage className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600">Belum Ada Calon Jemaah</p>
                <p className="text-xs text-slate-400 mt-1">Data jemaah dari Mitra akan muncul di sini secara otomatis.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredJamaahList
                  .filter((j) => {
                    const gender = getJamaahGender(j);
                    if (equipmentGenderFilter !== 'all' && gender !== equipmentGenderFilter) return false;

                    const eq = j.equipment || {};
                    const isKoper = eq.koper ?? eq.koperTas ?? false;
                    const isIhram = eq.ihram ?? eq.kainIhram ?? false;
                    const isBatik = eq.batik ?? eq.seragamBatik ?? false;
                    const isComplete = isKoper && isIhram && isBatik;

                    if (equipmentStatusFilter === 'complete' && !isComplete) return false;
                    if (equipmentStatusFilter === 'incomplete' && isComplete) return false;

                    return true;
                  })
                  .map((jamaah) => {
                    const gender = getJamaahGender(jamaah);
                    const isFemale = gender === 'P';

                    const eq = jamaah.equipment || {};
                    const isKoper = eq.koper ?? eq.koperTas ?? false;
                    const isIhram = eq.ihram ?? eq.kainIhram ?? false;
                    const isBatik = eq.batik ?? eq.seragamBatik ?? false;

                    const takenCount = (isKoper ? 1 : 0) + (isIhram ? 1 : 0) + (isBatik ? 1 : 0);
                    const percent = Math.round((takenCount / 3) * 100);
                    const isAllTaken = takenCount === 3;

                    return (
                      <div
                        key={jamaah.id}
                        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-5"
                      >
                        {/* Card Header: Jamaah Info & Progress */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${
                              isFemale ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {isFemale ? '👩' : '👨'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-slate-900 text-base">{jamaah.userName}</h4>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                                  isFemale ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  {isFemale ? 'Perempuan' : 'Laki-Laki'}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                                <span>NIK: <strong className="text-slate-800">{jamaah.nik || '-'}</strong></span>
                                <span>•</span>
                                <span>Mitra: <strong className="text-emerald-900">{jamaah.mitraName}</strong></span>
                                <span>•</span>
                                <span>Paket: <strong className="text-slate-800">{jamaah.packageName || 'Paket Umroh'}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            <div className="text-right">
                              <div className="text-[10px] font-black uppercase text-slate-400">Status Kelengkapan</div>
                              <div className="text-sm font-black text-emerald-800">{percent}% ({takenCount}/3 Item)</div>
                            </div>

                            <button
                              onClick={() => handleDownloadEquipmentReceipt(jamaah)}
                              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              title="Cetak Tanda Terima Serah Terima"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => toggleAllEquipmentForJamaah(jamaah.id, !isAllTaken)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer ${
                                isAllTaken
                                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              {isAllTaken ? 'Reset Status' : 'Tandai Semua Selesai'}
                            </button>
                          </div>
                        </div>

                        {/* 3 Equipment Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* ITEM 1: Koper & Tas Travel */}
                          <div
                            onClick={() => toggleEquipmentForJamaah(jamaah.id, 'koper')}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                              isKoper
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl">🧳</span>
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-900 leading-snug">Koper & Tas Travel</h5>
                                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Koper Bagasi 24", Kabin 20", Tas Paspor & ID Card</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-emerald-200/50">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                isKoper ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {isKoper ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                                {isKoper ? 'SUDAH DIAMBIL' : 'BELUM DIAMBIL'}
                              </span>

                              {/* Interactive Officer Tag */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingOfficerModal({
                                    jamaahId: jamaah.id,
                                    jamaahName: jamaah.userName,
                                    eqKey: 'koper',
                                    eqTitle: 'Koper & Tas Travel',
                                    currentOfficer: jamaah.equipmentOfficers?.koper || activeOfficerName || 'Admin Logistik'
                                  });
                                  setCustomOfficerInput(jamaah.equipmentOfficers?.koper || activeOfficerName || 'Admin Logistik');
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100/90 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 transition-all cursor-pointer group"
                                title="Klik untuk edit/mengubah nama petugas penanggung jawab"
                              >
                                <UserCheck className="w-3 h-3 text-emerald-700 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black">
                                  Petugas: {jamaah.equipmentOfficers?.koper || activeOfficerName || 'Admin Logistik'}
                                </span>
                                <Edit3 className="w-2.5 h-2.5 text-emerald-700 opacity-60 group-hover:opacity-100" />
                              </div>
                            </div>
                          </div>

                          {/* ITEM 2: Set Kain Ihram & Sabuk (L) / Set Mukena Syar'i (P) */}
                          <div
                            onClick={() => toggleEquipmentForJamaah(jamaah.id, 'ihram')}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                              isIhram
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl">{isFemale ? '🧕' : '🕋'}</span>
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-900 leading-snug">
                                    {isFemale ? 'Set Mukena Syar\'i & Bergo' : 'Set Kain Ihram & Sabuk'}
                                  </h5>
                                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                                    {isFemale ? 'Set Mukena Katun Syar\'i (Wanita)' : 'Set Kain Ihram Katun 2 Pcs & Sabuk (Pria)'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-emerald-200/50">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                isIhram ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {isIhram ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                                {isIhram ? 'SUDAH DIAMBIL' : 'BELUM DIAMBIL'}
                              </span>

                              {/* Interactive Officer Tag */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingOfficerModal({
                                    jamaahId: jamaah.id,
                                    jamaahName: jamaah.userName,
                                    eqKey: 'ihram',
                                    eqTitle: isFemale ? 'Set Mukena Syar\'i' : 'Set Kain Ihram & Sabuk',
                                    currentOfficer: jamaah.equipmentOfficers?.ihram || activeOfficerName || 'Admin Logistik'
                                  });
                                  setCustomOfficerInput(jamaah.equipmentOfficers?.ihram || activeOfficerName || 'Admin Logistik');
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100/90 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 transition-all cursor-pointer group"
                                title="Klik untuk edit/mengubah nama petugas penanggung jawab"
                              >
                                <UserCheck className="w-3 h-3 text-emerald-700 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black">
                                  Petugas: {jamaah.equipmentOfficers?.ihram || activeOfficerName || 'Admin Logistik'}
                                </span>
                                <Edit3 className="w-2.5 h-2.5 text-emerald-700 opacity-60 group-hover:opacity-100" />
                              </div>
                            </div>
                          </div>

                          {/* ITEM 3: Seragam Batik & Buku Doa */}
                          <div
                            onClick={() => toggleEquipmentForJamaah(jamaah.id, 'batik')}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                              isBatik
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl">👔</span>
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-900 leading-snug">Seragam Batik & Buku Doa</h5>
                                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Kain Batik Seragam Official & Buku Panduan Doa</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-emerald-200/50">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                isBatik ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {isBatik ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                                {isBatik ? 'SUDAH DIAMBIL' : 'BELUM DIAMBIL'}
                              </span>

                              {/* Interactive Officer Tag */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingOfficerModal({
                                    jamaahId: jamaah.id,
                                    jamaahName: jamaah.userName,
                                    eqKey: 'batik',
                                    eqTitle: 'Seragam Batik & Buku Doa',
                                    currentOfficer: jamaah.equipmentOfficers?.batik || activeOfficerName || 'Admin Logistik'
                                  });
                                  setCustomOfficerInput(jamaah.equipmentOfficers?.batik || activeOfficerName || 'Admin Logistik');
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100/90 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 transition-all cursor-pointer group"
                                title="Klik untuk edit/mengubah nama petugas penanggung jawab"
                              >
                                <UserCheck className="w-3 h-3 text-emerald-700 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black">
                                  Petugas: {jamaah.equipmentOfficers?.batik || activeOfficerName || 'Admin Logistik'}
                                </span>
                                <Edit3 className="w-2.5 h-2.5 text-emerald-700 opacity-60 group-hover:opacity-100" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 5: DOKUMEN KEBERANGKATAN */}
      {currentTab === 'dokumen_keberangkatan' && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider mb-1 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> PERSETUJUAN & DOKUMEN KEBERANGKATAN
              </div>
              <h3 className="font-playfair font-bold text-slate-900 text-xl">Penerbitan Dokumen Keberangkatan Jemaah</h3>
              <p className="text-xs text-slate-500">Kelola persetujuan penerbitan <strong className="text-slate-800">Tiket</strong>, <strong className="text-slate-800">Visa</strong>, dan <strong className="text-slate-800">Polis Asuransi</strong> untuk Partner Mitra.</p>
            </div>

            {/* Quick Bulk Action */}
            {filteredJamaahList.length > 0 && (
              <button
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: 'Terbitkan Semua Dokumen',
                    message: 'Apakah Anda yakin ingin menyetujui & menerbitkan SEMUA dokumen (Tiket, Visa, Polis) untuk seluruh jemaah terdaftar?',
                    type: 'success',
                    confirmText: 'Ya, Terbitkan Semua',
                    onConfirm: () => {
                      const updated = jamaahList.map(j => ({
                        ...j,
                        issuedDocs: { tiket: true, visa: true, polis: true }
                      }));
                      setJamaahList(updated);
                      saveAndSyncState(updated);
                      toast.success('Seluruh dokumen keberangkatan berhasil disetujui & diterbitkan!');
                    }
                  });
                }}
                className="px-5 py-2.5 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-extrabold text-xs transition-all flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Terbitkan Semua Dokumen Jemaah (100%)
              </button>
            )}
          </div>

          {filteredJamaahList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">
              <p className="text-sm font-bold text-slate-600">Belum Ada Dokumen Keberangkatan Jemaah</p>
              <p className="text-xs text-slate-400">Belum ada jemaah terdaftar yang sesuai dengan filter.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredJamaahList.map((jamaah) => {
                const docs = jamaah.issuedDocs || {};
                const isTiket = docs.tiket ?? docs.tiketPesawat ?? true;
                const isVisa = docs.visa ?? docs.visaUmroh ?? true;
                const isPolis = docs.polis ?? docs.polisAsuransi ?? true;

                const isFemale = (jamaah.jenisKelamin || jamaah.gender || '').toString().toLowerCase().includes('p');
                const approvedCount = (isTiket ? 1 : 0) + (isVisa ? 1 : 0) + (isPolis ? 1 : 0);
                const percent = Math.round((approvedCount / 3) * 100);
                const isAllApproved = approvedCount === 3;

                return (
                  <div key={jamaah.id} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all">
                    {/* Header Jemaah */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-900 text-amber-400 font-black flex items-center justify-center text-sm shadow-md shrink-0">
                          {jamaah.userName ? jamaah.userName.charAt(0).toUpperCase() : 'J'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-playfair font-bold text-slate-900 text-base">{jamaah.userName}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isFemale ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {isFemale ? 'Perempuan' : 'Laki-Laki'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                            <span>NIK: <strong className="text-slate-800">{jamaah.nik || '-'}</strong></span>
                            <span>•</span>
                            <span>Mitra: <strong className="text-emerald-900">{jamaah.mitraName}</strong></span>
                            <span>•</span>
                            <span>Paket: <strong className="text-slate-800">{jamaah.packageName || 'Paket Umroh'}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <div className="text-right">
                          <div className="text-[10px] font-black uppercase text-slate-400">Status Persetujuan</div>
                          <div className="text-sm font-black text-emerald-800">{percent}% ({approvedCount}/3 Dokumen)</div>
                        </div>

                        <button
                          onClick={() => toggleAllIssuedDocsForJamaah(jamaah.id, !isAllApproved)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer ${
                            isAllApproved
                              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {isAllApproved ? 'Reset Status' : 'Setujui Semua (100%)'}
                        </button>
                      </div>
                    </div>

                    {/* 3 Document Cards: Tiket, Visa, Polis */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* 1. Tiket */}
                      {(() => {
                        const fileData = jamaah.docFiles?.tiket;
                        return (
                          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                            isTiket ? 'bg-emerald-50/80 border-emerald-300' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl">✈️</span>
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-900 leading-snug">Tiket Pesawat PP</h5>
                                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">E-Tiket Flight Saudia / Garuda Indonesia</p>
                                </div>
                              </div>
                            </div>

                            {fileData ? (
                              <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2 shadow-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-lg shrink-0">📄</span>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-900 truncate" title={fileData.name}>{fileData.name}</p>
                                      <p className="text-[10px] text-slate-500">{fileData.size} • {fileData.uploadedAt}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleAdminFileDelete(jamaah.id, 'tiket')}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shrink-0"
                                    title="Hapus File Upload"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                  <button
                                    onClick={() => handleDownloadBase64(fileData.data, fileData.name)}
                                    className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5 text-amber-400" /> Lihat / Unduh PDF
                                  </button>
                                  <label className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-200 shrink-0">
                                    <input
                                      type="file"
                                      accept=".pdf,application/pdf"
                                      className="hidden"
                                      onChange={(e) => handleAdminFileUpload(jamaah.id, 'tiket', e)}
                                    />
                                    <Upload className="w-3 h-3 text-slate-600" /> Ganti
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/60 rounded-xl p-3 flex flex-col items-center justify-center transition-all cursor-pointer text-center group">
                                <input
                                  type="file"
                                  accept=".pdf,application/pdf"
                                  className="hidden"
                                  onChange={(e) => handleAdminFileUpload(jamaah.id, 'tiket', e)}
                                />
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 group-hover:bg-emerald-700 group-hover:text-white transition-all flex items-center justify-center mb-1">
                                  <Upload className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-black text-slate-800 group-hover:text-emerald-900">Upload PDF Tiket</span>
                                <span className="text-[10px] text-slate-400 group-hover:text-slate-600 font-medium mt-0.5">Pilih file berformat .pdf</span>
                              </label>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                isTiket ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {isTiket ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                                {isTiket ? 'DITERBITKAN' : 'BELUM TERBIT'}
                              </span>

                              <button
                                onClick={() => toggleIssuedDocForJamaah(jamaah.id, 'tiket')}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  isTiket
                                    ? 'bg-slate-900 text-amber-400 hover:bg-slate-800'
                                    : 'bg-emerald-900 text-white hover:bg-emerald-800'
                                }`}
                              >
                                {isTiket ? 'Batalkan' : 'Terbitkan'}
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 2. Visa */}
                      {(() => {
                        const fileData = jamaah.docFiles?.visa;
                        return (
                          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                            isVisa ? 'bg-emerald-50/80 border-emerald-300' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl">🛡️</span>
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-900 leading-snug">E-Visa Umrah KSA</h5>
                                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Visa Resmi Kerajaan Arab Saudi (Ministry)</p>
                                </div>
                              </div>
                            </div>

                            {fileData ? (
                              <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2 shadow-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-lg shrink-0">📄</span>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-900 truncate" title={fileData.name}>{fileData.name}</p>
                                      <p className="text-[10px] text-slate-500">{fileData.size} • {fileData.uploadedAt}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleAdminFileDelete(jamaah.id, 'visa')}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shrink-0"
                                    title="Hapus File Upload"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                  <button
                                    onClick={() => handleDownloadBase64(fileData.data, fileData.name)}
                                    className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5 text-amber-400" /> Lihat / Unduh PDF
                                  </button>
                                  <label className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-200 shrink-0">
                                    <input
                                      type="file"
                                      accept=".pdf,application/pdf"
                                      className="hidden"
                                      onChange={(e) => handleAdminFileUpload(jamaah.id, 'visa', e)}
                                    />
                                    <Upload className="w-3 h-3 text-slate-600" /> Ganti
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/60 rounded-xl p-3 flex flex-col items-center justify-center transition-all cursor-pointer text-center group">
                                <input
                                  type="file"
                                  accept=".pdf,application/pdf"
                                  className="hidden"
                                  onChange={(e) => handleAdminFileUpload(jamaah.id, 'visa', e)}
                                />
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 group-hover:bg-emerald-700 group-hover:text-white transition-all flex items-center justify-center mb-1">
                                  <Upload className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-black text-slate-800 group-hover:text-emerald-900">Upload PDF Visa</span>
                                <span className="text-[10px] text-slate-400 group-hover:text-slate-600 font-medium mt-0.5">Pilih file berformat .pdf</span>
                              </label>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                isVisa ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {isVisa ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                                {isVisa ? 'DITERBITKAN' : 'BELUM TERBIT'}
                              </span>

                              <button
                                onClick={() => toggleIssuedDocForJamaah(jamaah.id, 'visa')}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  isVisa
                                    ? 'bg-slate-900 text-amber-400 hover:bg-slate-800'
                                    : 'bg-emerald-900 text-white hover:bg-emerald-800'
                                }`}
                              >
                                {isVisa ? 'Batalkan' : 'Terbitkan'}
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 3. Polis */}
                      {(() => {
                        const fileData = jamaah.docFiles?.polis;
                        return (
                          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                            isPolis ? 'bg-emerald-50/80 border-emerald-300' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl">💚</span>
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-900 leading-snug">Polis Asuransi</h5>
                                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Polis Asuransi Perjalanan Syariah Full Cover</p>
                                </div>
                              </div>
                            </div>

                            {fileData ? (
                              <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2 shadow-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-lg shrink-0">📄</span>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-900 truncate" title={fileData.name}>{fileData.name}</p>
                                      <p className="text-[10px] text-slate-500">{fileData.size} • {fileData.uploadedAt}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleAdminFileDelete(jamaah.id, 'polis')}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shrink-0"
                                    title="Hapus File Upload"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                  <button
                                    onClick={() => handleDownloadBase64(fileData.data, fileData.name)}
                                    className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5 text-amber-400" /> Lihat / Unduh PDF
                                  </button>
                                  <label className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-200 shrink-0">
                                    <input
                                      type="file"
                                      accept=".pdf,application/pdf"
                                      className="hidden"
                                      onChange={(e) => handleAdminFileUpload(jamaah.id, 'polis', e)}
                                    />
                                    <Upload className="w-3 h-3 text-slate-600" /> Ganti
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/60 rounded-xl p-3 flex flex-col items-center justify-center transition-all cursor-pointer text-center group">
                                <input
                                  type="file"
                                  accept=".pdf,application/pdf"
                                  className="hidden"
                                  onChange={(e) => handleAdminFileUpload(jamaah.id, 'polis', e)}
                                />
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 group-hover:bg-emerald-700 group-hover:text-white transition-all flex items-center justify-center mb-1">
                                  <Upload className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-black text-slate-800 group-hover:text-emerald-900">Upload PDF Polis</span>
                                <span className="text-[10px] text-slate-400 group-hover:text-slate-600 font-medium mt-0.5">Pilih file berformat .pdf</span>
                              </label>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                isPolis ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {isPolis ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                                {isPolis ? 'DITERBITKAN' : 'BELUM TERBIT'}
                              </span>

                              <button
                                onClick={() => toggleIssuedDocForJamaah(jamaah.id, 'polis')}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  isPolis
                                    ? 'bg-slate-900 text-amber-400 hover:bg-slate-800'
                                    : 'bg-emerald-900 text-white hover:bg-emerald-800'
                                }`}
                              >
                                {isPolis ? 'Batalkan' : 'Terbitkan'}
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL FOR ADMIN */}
      {selectedJamaahForDetail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-6 bg-gradient-to-r from-emerald-950 to-teal-900 text-white flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase text-amber-400 tracking-widest">Detail Jamaah Binaan Mitra</div>
                <h3 className="text-xl font-playfair font-bold">{selectedJamaahForDetail.userName}</h3>
                <p className="text-xs text-emerald-100/80">Mitra: {selectedJamaahForDetail.mitraName}</p>
              </div>
              <button
                onClick={() => setSelectedJamaahForDetail(null)}
                className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">ID Registrasi</span>
                  <p className="font-extrabold text-slate-900 text-sm">{selectedJamaahForDetail.id}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Paket Terpilih</span>
                  <p className="font-extrabold text-emerald-900 text-sm">{selectedJamaahForDetail.packageName}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Jumlah Pax</span>
                  <p className="font-extrabold text-slate-900 text-sm">{selectedJamaahForDetail.paxCount || selectedJamaahForDetail.jumlahPax || 1} Orang</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Status Biodata</span>
                  <p className="font-extrabold text-emerald-800 text-sm">{selectedJamaahForDetail.statusBiodata.toUpperCase()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-700" /> Informasi Biodata Lengkap
                </h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">NIK KTP</span>
                    <p className="font-extrabold text-slate-900">{selectedJamaahForDetail.nik || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Jenis Kelamin</span>
                    <p className="font-bold text-slate-900">{selectedJamaahForDetail.jenisKelamin || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Tempat / Tanggal Lahir</span>
                    <p className="font-bold text-slate-900">{selectedJamaahForDetail.tempatLahir || '-'}, {selectedJamaahForDetail.tanggalLahir || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Status Pernikahan</span>
                    <p className="font-bold text-slate-900">{selectedJamaahForDetail.statusPernikahan || '-'}</p>
                  </div>
                  {selectedJamaahForDetail.statusPernikahan === 'Menikah' && (
                    <div className="col-span-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/60">
                      <span className="text-emerald-800 font-bold text-[10px] uppercase">Nama Pasangan (Suami / Istri)</span>
                      <p className="font-black text-emerald-950 text-sm">{selectedJamaahForDetail.namaPasangan || '(Belum diisi)'}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Pekerjaan</span>
                    <p className="font-bold text-slate-900">{selectedJamaahForDetail.pekerjaan || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">No. WhatsApp / HP</span>
                    <p className="font-bold text-slate-900">{selectedJamaahForDetail.userPhone || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Alamat Lengkap Domisili</span>
                    <p className="font-bold text-slate-900">{selectedJamaahForDetail.alamatLengkap || '-'}</p>
                  </div>
                </div>
              </div>

              {/* PASPOR RI */}
              <div className="space-y-3">
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Luggage className="w-3.5 h-3.5 text-amber-600" /> Informasi Paspor RI
                </h4>
                <div className="grid grid-cols-2 gap-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60">
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Nomor Paspor</span>
                    <p className="font-black text-amber-950 font-mono text-sm">{selectedJamaahForDetail.pasporNo || 'Belum Ada'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Nama di Paspor</span>
                    <p className="font-bold text-slate-900">{selectedJamaahForDetail.pasporNama || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Tempat / Tgl Terbit</span>
                    <p className="font-bold text-slate-900">{selectedJamaahForDetail.pasporTempat || '-'}, {selectedJamaahForDetail.pasporTglTerbit || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Masa Berlaku S/d</span>
                    <p className="font-bold text-emerald-800">{selectedJamaahForDetail.pasporTglExpired || selectedJamaahForDetail.pasporExpired || '-'}</p>
                  </div>
                </div>
              </div>

              {/* KONTAK DARURAT */}
              <div className="space-y-3">
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" /> Kontak Darurat & Mahram
                </h4>
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Nama Kontak</span>
                    <p className="font-bold text-slate-900">{selectedJamaahForDetail.kontakDaruratNama || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Hubungan</span>
                    <p className="font-bold text-slate-900">{selectedJamaahForDetail.kontakDaruratHubungan || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">No. Telepon</span>
                    <p className="font-bold text-slate-900">{selectedJamaahForDetail.kontakDaruratPhone || '-'}</p>
                  </div>
                </div>
              </div>

              {/* ADMIN REVIEW SECTION */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="font-black text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin Review & Internal Notes
                </h4>
                <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Catatan Review Admin</label>
                    <textarea 
                      value={selectedJamaahForDetail.adminNote || ''}
                      onChange={(e) => handleUpdateAdminNote(selectedJamaahForDetail.id, e.target.value)}
                      placeholder="Contoh: Dokumen paspor kurang jelas, harap minta mitra re-upload..."
                      className="w-full bg-white border border-emerald-200 rounded-2xl p-4 text-xs font-medium outline-none focus:border-emerald-500 shadow-inner min-h-[100px]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] text-slate-400 font-bold italic max-w-[200px]">
                      Catatan ini hanya terlihat oleh tim Admin untuk keperluan internal review.
                    </p>
                    <button 
                      onClick={() => {
                        handleToggleVerifyBiodata(selectedJamaahForDetail.id);
                        setSelectedJamaahForDetail(null);
                      }}
                      className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all ${
                        selectedJamaahForDetail.statusBiodata === 'verified'
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-emerald-900 text-amber-400 hover:bg-slate-900'
                      }`}
                    >
                      {selectedJamaahForDetail.statusBiodata === 'verified' ? 'Batalkan Verifikasi' : 'Setujui & Verifikasi Sekarang'}
                    </button>
                  </div>
                </div>
              </div>

              {/* RIWAYAT MEDIS & KONDISI KESEHATAN */}
              <div className="space-y-3">
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-600" /> Riwayat Medis & Penyakit Bawaan
                </h4>
                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200/60 space-y-3">
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase block mb-1.5">
                      Kondisi / Riwayat Penyakit Bawaan
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(() => {
                        let medList = selectedJamaahForDetail.riwayatMedisPenyakit || selectedJamaahForDetail.medicalConditions;
                        if (!medList && (selectedJamaahForDetail.riwayatMedis || selectedJamaahForDetail.medicalHistory)) {
                          medList = [selectedJamaahForDetail.riwayatMedis || selectedJamaahForDetail.medicalHistory];
                        }
                        if (!medList || (Array.isArray(medList) && medList.length === 0)) {
                          medList = ['Sehat / Tidak ada'];
                        }
                        const listArr = Array.isArray(medList) ? medList : [String(medList)];
                        return listArr.map((item: string, idx: number) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border flex items-center gap-1 ${
                              item === 'Sehat / Tidak ada' || item === "Sehat Wal'afiat" || item === '-'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-rose-100 text-rose-900 border-rose-300'
                            }`}
                          >
                            <HeartPulse className="w-3 h-3 text-rose-600" />
                            {item}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase block mb-1">
                      Catatan Detail / Konsumsi Obat Rutin (Input Kustom)
                    </span>
                    <p className={`font-medium text-xs leading-relaxed p-2.5 rounded-xl bg-white border border-rose-100 ${
                      (selectedJamaahForDetail.riwayatMedisDetail || selectedJamaahForDetail.medicalHistoryDetails)
                        ? 'text-slate-800 font-bold'
                        : 'text-slate-400 italic'
                    }`}>
                      {selectedJamaahForDetail.riwayatMedisDetail || selectedJamaahForDetail.medicalHistoryDetails || '(Tidak ada catatan medis tambahan)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedJamaahForDetail(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  generateRegistrationFormPdf(selectedJamaahForDetail);
                  toast.success('Formulir PDF diunduh!');
                }}
                className="px-5 py-2 bg-emerald-900 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" /> Unduh PDF Registration Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROOF PREVIEW MODAL */}
      {selectedProof && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm cursor-pointer"
          onClick={() => setSelectedProof(null)}
        >
          <div 
            className="bg-white rounded-[2rem] overflow-hidden max-w-xl w-full shadow-2xl relative cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <FileSearch className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="font-playfair font-bold text-slate-900 text-lg">Pratinjau Bukti</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Validasi Pembayaran</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProof(null)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="p-6 bg-slate-100/50 flex items-center justify-center min-h-[400px]">
              {selectedProof && (selectedProof.toLowerCase().endsWith('.pdf') || selectedProof.startsWith('data:application/pdf') || selectedProof.includes('blob:')) ? (
                <div className="w-full h-full min-h-[500px] flex flex-col gap-4">
                  <iframe 
                    src={`${selectedProof}${selectedProof.includes('blob:') ? '' : '#toolbar=0'}`} 
                    className="w-full h-[550px] rounded-xl shadow-inner border border-slate-200 bg-white" 
                    title="PDF Proof"
                    onError={() => toast.error('Gagal menampilkan PDF. Silakan buka di tab baru.')}
                  />
                  <p className="text-[10px] text-center text-slate-400 italic">Jika PDF tidak muncul, silakan klik tombol "TAB BARU" di bawah.</p>
                </div>
              ) : (
                <div 
                  className="p-6 bg-white rounded-[2rem] shadow-xl border border-slate-200 max-w-full overflow-hidden relative group"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img 
                    src={selectedProof} 
                    alt="Payment Proof" 
                    className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-sm transition-all duration-500 group-hover:scale-[1.02] cursor-zoom-in" 
                    onClick={() => window.open(selectedProof, '_blank')}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/600x800?text=Bukti+Transfer+Terlampir';
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-all pointer-events-none" />
                  <div className="mt-4 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2 text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">
                      <Eye className="w-3 h-3" /> KLIK UNTUK UKURAN PENUH
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedProof(null)}
                className="px-6 py-3 bg-slate-100 text-slate-600 font-black text-[10px] rounded-xl hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                TUTUP
              </button>
              <div className="flex items-center gap-2">
                <a
                  href={selectedProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-white border border-slate-200 text-slate-700 font-black text-[10px] rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5" />
                  TAB BARU
                </a>
                <a
                  href={selectedProof}
                  download
                  className="px-8 py-3 bg-emerald-600 text-white font-black text-[10px] rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-100 active:scale-95 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  UNDUH
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT NAMA PETUGAS LOGISTIK */}
      {editingOfficerModal && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setEditingOfficerModal(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Input Nama Petugas Logistik</h4>
                  <p className="text-[11px] text-slate-500">{editingOfficerModal.eqTitle} — {editingOfficerModal.jamaahName}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingOfficerModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-700 uppercase block">
                Nama Petugas Admin Penanggung Jawab:
              </label>
              <input
                type="text"
                value={customOfficerInput}
                onChange={(e) => setCustomOfficerInput(e.target.value)}
                placeholder="Masukkan nama petugas (contoh: Hj. Fatimah / Mas Budi)"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                autoFocus
              />

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Preset Nama Cepat:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Hj. Fatimah (Admin Logistik)', 'Ahmad Gudang', 'Siti Logistik', 'Ust. Hasan', 'Admin'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setCustomOfficerInput(p)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 transition-all cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingOfficerModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={saveCustomOfficerForItem}
                className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-900 text-amber-300 hover:bg-emerald-800 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 text-amber-400" /> Simpan Petugas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
      />

    </div>
  );
}
