import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, FileText, Download, Edit2, Save, Users, ShieldCheck, 
  Phone, Mail, MapPin, Calendar, Clock, AlertCircle, CheckCircle2,
  Plus, Check, Sparkles, ChevronDown, Trash2, ArrowRight, Luggage,
  Tag, RefreshCw, RotateCcw, Eraser, X, Activity, HeartPulse, Stethoscope
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { generateRegistrationFormPdf } from '../../utils/generateRegistrationFormPdf';
import { getScopedKey, filterJamaahForCurrentMitra, getActiveMitraInfo } from '../../utils/mitraStorage';
import ConfirmModal from '../ui/ConfirmModal';

const MEDICAL_OPTIONS = [
  'Sehat / Tidak ada',
  'Hipertensi (Darah Tinggi)',
  'Asma / Gangguan Pernapasan',
  'Penyakit Jantung',
  'Diabetes (Kencing Manis)',
  'Stroke',
  'Penyakit Bawaan / Kronis',
  'Lainnya'
];

interface MitraJamaahBiodataProps {
  jamaahList: any[];
  onRefresh?: () => void;
}

// Packages for selection
const AVAILABLE_PACKAGES = [
  { id: 'pkg-1', name: 'Umroh Berkah Barokah (Silver)', price: 28500000, category: 'Silver', duration: '9 Hari' },
  { id: 'pkg-2', name: 'Umroh Executive', price: 32500000, category: 'Executive', duration: '12 Hari' },
  { id: 'pkg-3', name: 'Umroh VIP (Platinum)', price: 38500000, category: 'Platinum', duration: '12 Hari' },
  { id: 'pkg-4', name: 'Haji Furoda 2026', price: 250000000, category: 'Haji', duration: '25 Hari' },
];

// Helper to create a completely blank Pax object
const createBlankPax = (paxNo: number, registrationId?: string, packageName?: string, packagePrice?: number) => ({
  id: `JAM-SLOT-${paxNo}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  paxNo: paxNo,
  registrationId: registrationId || `REG-${Date.now()}`,
  packageName: packageName || '',
  packagePrice: packagePrice || 0,
  userName: '',
  userPhone: '',
  userEmail: '',
  nik: '',
  tempatLahir: '',
  tanggalLahir: '',
  jenisKelamin: 'Laki-laki',
  statusPernikahan: 'Menikah',
  namaPasangan: '',
  pekerjaan: '',
  alamatLengkap: '',
  pasporNo: '',
  pasporNama: '',
  pasporTempat: '',
  pasporTglTerbit: '',
  pasporTglExpired: '',
  kontakDaruratNama: '',
  kontakDaruratHubungan: '',
  kontakDaruratPhone: '',
  isComplete: false,
  registeredAt: new Date().toISOString()
});

export default function MitraJamaahBiodata({ jamaahList, onRefresh }: MitraJamaahBiodataProps) {
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
    type: 'info',
    onConfirm: () => {}
  });

  // Registration Flow State - defaulting directly to biodata input
  const [regFlowStep, setRegFlowStep] = useState<'select_package' | 'set_pax' | 'biodata'>(() => {
    // We now default to 'biodata' directly as requested by user
    return 'biodata';
  });

  const [tempRegInfo, setTempRegInfo] = useState<{
    packageId: string;
    packageName: string;
    packagePrice: number;
    paxCount: number;
    registrationId: string;
    departureDate: string;
  }>(() => {
    // Check if we have a fresh selection from Katalog
    const fromKatalog = localStorage.getItem('selected_mitra_package');
    if (fromKatalog) {
      try {
        const parsed = JSON.parse(fromKatalog);
        return {
          packageId: parsed.package?.id || '',
          packageName: parsed.package?.name || '',
          packagePrice: parsed.package?.price || 0,
          paxCount: parsed.paxCount || 1,
          registrationId: parsed.registrationId || `REG-${Date.now()}`,
          departureDate: parsed.departureDate || ''
        };
      } catch (e) {}
    }
    
    const saved = localStorage.getItem('mitra_temp_reg_info');
    return saved ? JSON.parse(saved) : { 
      packageId: '', 
      packageName: '', 
      packagePrice: 0, 
      paxCount: 1, 
      registrationId: `REG-${Date.now()}`,
      departureDate: '' 
    };
  });

  useEffect(() => {
    localStorage.setItem('mitra_reg_flow_step', regFlowStep);
    localStorage.setItem('mitra_temp_reg_info', JSON.stringify(tempRegInfo));
  }, [regFlowStep, tempRegInfo]);

  // Submenu state: 'input' (Formulir Pengisian) or 'rekap' (Submenu Rekap Jamaah Terinput)
  const [submenuTab, setSubmenuTab] = useState<'input' | 'rekap'>('input');

  // Initialize pax list from localStorage scoped to active Mitra
  const [paxList, setPaxList] = useState<any[]>(() => {
    try {
      const scopedKey = getScopedKey('mitra_saved_pax_list');
      const saved = localStorage.getItem(scopedKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }

      // Check central DB filtered for current mitra
      const centralDbStr = localStorage.getItem('mitra_jamaah_database');
      if (centralDbStr) {
        const centralDb = JSON.parse(centralDbStr);
        const filtered = filterJamaahForCurrentMitra(centralDb);
        if (filtered.length > 0) return filtered;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    if (tempRegInfo?.registrationId) {
      const hasGroup = paxList.some(p => p.registrationId === tempRegInfo.registrationId);
      
      if (!hasGroup) {
        const targetCount = tempRegInfo.paxCount || 1;
        const newSlots = [];
        for (let i = 0; i < targetCount; i++) {
          const slot = createBlankPax(
            i + 1, 
            tempRegInfo.registrationId, 
            tempRegInfo.packageName,
            tempRegInfo.packagePrice
          );
          // @ts-ignore
          slot.departureDate = tempRegInfo.departureDate;
          newSlots.push(slot);
        }
        
        const updatedList = [...newSlots, ...paxList];
        setPaxList(updatedList);
        localStorage.setItem(getScopedKey('mitra_saved_pax_list'), JSON.stringify(updatedList));
        
        // Sync immediately so Admin can see the new group slots
        syncToCentralDatabase(updatedList);
        
        // Auto select first slot of new group
        const newIdx = updatedList.findIndex(p => p.registrationId === tempRegInfo.registrationId);
        if (newIdx !== -1) setActivePaxIdx(newIdx);
        
        toast.success(`Berhasil membuat kategori rombongan baru: ${tempRegInfo.packageName} (${targetCount} Pax)`);
        
        // Clear the selection from catalog after initializing
        localStorage.removeItem('selected_mitra_package');
      }
    }
  }, [tempRegInfo?.registrationId]);

  // Grouped pax list for UI categorization
  const groupedPax = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    paxList.forEach((p, idx) => {
      const gid = p.registrationId || 'Lainnya';
      if (!groups[gid]) groups[gid] = [];
      groups[gid].push({ ...p, originalIdx: idx });
    });
    return groups;
  }, [paxList]);

  // Current active group filter (default to the latest group if exists)
  const [activeGroupId, setActiveGroupId] = useState<string | 'all'>(() => {
    try {
      const saved = localStorage.getItem('selected_mitra_package');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.registrationId || 'all';
      }
    } catch (e) {}
    return 'all';
  });

  // Filter for reports
  const [reportFilterDate, setReportFilterDate] = useState('');
  const [reportSearchTerm, setReportSearchTerm] = useState('');

  const filteredHistory = useMemo(() => {
    return paxList.filter(p => {
      if (!p.userName) return false;
      const matchesSearch = p.userName.toLowerCase().includes(reportSearchTerm.toLowerCase()) || 
                           (p.registrationId && p.registrationId.toLowerCase().includes(reportSearchTerm.toLowerCase()));
      
      const pDate = p.registeredAt ? new Date(p.registeredAt) : null;
      const matchesDate = !reportFilterDate || (pDate && pDate.toISOString().startsWith(reportFilterDate));
      
      return matchesSearch && matchesDate;
    }).sort((a, b) => {
      const dateA = a.registeredAt ? new Date(a.registeredAt).getTime() : 0;
      const dateB = b.registeredAt ? new Date(b.registeredAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [paxList, reportSearchTerm, reportFilterDate]);

  // Adjust activePaxIdx when group changes
  useEffect(() => {
    if (isForcedEdit) return;
    if (activeGroupId !== 'all' && activeGroupPax.length > 0) {
      // Find index of first incomplete member in group or just first member
      const firstIncomplete = activeGroupPax.findIndex(p => !p.isComplete);
      const targetIdxInGroup = firstIncomplete !== -1 ? firstIncomplete : 0;
      
      // Map back to global index
      const globalIdx = paxList.findIndex(p => p.id === activeGroupPax[targetIdxInGroup]?.id);
      if (globalIdx !== -1) setActivePaxIdx(globalIdx);
    }
  }, [activeGroupId]);

  // Derived state for the active group
  const activeGroupPax = useMemo(() => {
    if (activeGroupId === 'all') return paxList;
    return paxList.filter(p => p.registrationId === activeGroupId);
  }, [paxList, activeGroupId]);

  // Sync real-time updates from Portal Admin
  useEffect(() => {
    const handleSync = () => {
      try {
        const scopedKey = getScopedKey('mitra_saved_pax_list');
        const stored = localStorage.getItem(scopedKey);
        const centralDbStr = localStorage.getItem('mitra_jamaah_database');
        
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            if (centralDbStr) {
              const centralDb = filterJamaahForCurrentMitra(JSON.parse(centralDbStr));
              const synced = parsed.map(p => {
                const centralMatch = centralDb.find((cj: any) => cj.id === p.id);
                if (centralMatch) {
                  return { ...p, statusBiodata: centralMatch.statusBiodata, adminNote: centralMatch.adminNote };
                }
                return p;
              });
              setPaxList(synced);
            } else {
              setPaxList(parsed);
            }
          }
        } else if (centralDbStr) {
          const filtered = filterJamaahForCurrentMitra(JSON.parse(centralDbStr));
          if (filtered.length > 0) setPaxList(filtered);
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

  const [activePaxIdx, setActivePaxIdx] = useState(0);

  // Effect to automatically select the first incomplete slot on mount or when switching to input tab
  useEffect(() => {
    if (isForcedEdit) {
      // Small timeout to reset so subsequent tab switches work normally
      const timer = setTimeout(() => setIsForcedEdit(false), 100);
      return () => clearTimeout(timer);
    }
    const firstIncompleteIdx = paxList.findIndex(p => !p.isComplete);
    if (submenuTab === 'input' && firstIncompleteIdx !== -1 && firstIncompleteIdx !== activePaxIdx) {
      setActivePaxIdx(firstIncompleteIdx);
    }
  }, [submenuTab]);

  const activePax = paxList[activePaxIdx] || paxList[0];

  const [mitraInfo, setMitraInfo] = useState(() => {
    try {
      const profStr = localStorage.getItem('mitra_profile');
      if (profStr) {
        const p = JSON.parse(profStr);
        return {
          name: p.fullName || p.namaLengkap || p.name || '',
          phone: p.phone || p.whatsapp || '',
          email: p.email || '',
          level: p.level || p.mitraLevel || 'Mitra',
          id: (p.id && p.id !== 'mitra-user') ? p.id : (p.userId || '')
        };
      }
    } catch (e) {}
    return {
      name: '',
      phone: '',
      email: '',
      level: 'Mitra',
      id: ''
    };
  });

  // Fetch real profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [p, me] = await Promise.all([
          api.get('/mitra/profile').catch(() => null),
          api.get('/auth/me').catch(() => null)
        ]);
        const user = me?.user;
        const realId = user?.id || p?.userId || p?.id || localStorage.getItem('current_mitra_id');
        const realEmail = user?.email || p?.email || localStorage.getItem('current_mitra_email');
        const realName = p?.namaLengkap || p?.fullName || user?.name || localStorage.getItem('current_mitra_name');

        if (realId || realName || realEmail) {
          const updated = {
            name: realName || mitraInfo.name,
            phone: p?.whatsapp || user?.phone || mitraInfo.phone,
            email: realEmail || mitraInfo.email,
            level: p?.mitraLevel || user?.mitraLevel || mitraInfo.level || 'Mitra',
            id: realId || mitraInfo.id
          };
          setMitraInfo(updated);
          localStorage.setItem('mitra_profile', JSON.stringify(updated));
        }
      } catch (e) {
        // Silent fallback to local storage
      }
    };
    fetchProfile();
  }, []);

  const [isEditingMitra, setIsEditingMitra] = useState(false);
  const [mitraForm, setMitraForm] = useState({
    name: mitraInfo.name,
    phone: mitraInfo.phone,
    email: mitraInfo.email,
    level: mitraInfo.level || 'Mitra'
  });

  const handleStartEditMitra = () => {
    setMitraForm({
      name: mitraInfo.name,
      phone: mitraInfo.phone,
      email: mitraInfo.email,
      level: mitraInfo.level || 'Mitra'
    });
    setIsEditingMitra(true);
  };

  const handleSaveMitraInfo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated = {
      ...mitraInfo,
      name: mitraForm.name,
      phone: mitraForm.phone,
      email: mitraForm.email,
      level: mitraForm.level || 'Mitra'
    };
    setMitraInfo(updated);
    setIsEditingMitra(false);

    try {
      const profStr = localStorage.getItem('mitra_profile');
      let existing = {};
      if (profStr) {
        try { existing = JSON.parse(profStr); } catch (err) {}
      }
      localStorage.setItem('mitra_profile', JSON.stringify({
        ...existing,
        fullName: updated.name,
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        level: updated.level
      }));
    } catch (err) {}

    syncToCentralDatabase(paxList);
    toast.success('Data Pemesan / Mitra Penanggung Jawab berhasil diperbarui!');
  };

  const getFormDataFromPax = (pax: any) => {
    let medicalList: string[] = ['Sehat / Tidak ada'];
    if (Array.isArray(pax?.riwayatMedisPenyakit) && pax.riwayatMedisPenyakit.length > 0) {
      medicalList = pax.riwayatMedisPenyakit;
    } else if (Array.isArray(pax?.medicalConditions) && pax.medicalConditions.length > 0) {
      medicalList = pax.medicalConditions;
    } else if (pax?.riwayatMedis && typeof pax.riwayatMedis === 'string' && pax.riwayatMedis !== '-' && pax.riwayatMedis !== 'Sehat / Tidak ada') {
      medicalList = pax.riwayatMedis.split(',').map((s: string) => s.trim()).filter(Boolean);
    } else if (pax?.medicalHistory && typeof pax.medicalHistory === 'string' && pax.medicalHistory !== '-' && pax.medicalHistory !== 'Sehat / Tidak ada') {
      medicalList = pax.medicalHistory.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    if (medicalList.length === 0) {
      medicalList = ['Sehat / Tidak ada'];
    }

    return {
      userName: pax?.userName || pax?.name || '',
      userPhone: pax?.userPhone || pax?.phone || '',
      userEmail: pax?.userEmail || pax?.email || '',
      nik: pax?.nik || '',
      tempatLahir: pax?.tempatLahir || '',
      tanggalLahir: pax?.tanggalLahir || '',
      jenisKelamin: pax?.jenisKelamin || 'Laki-laki',
      statusPernikahan: pax?.statusPernikahan || 'Menikah',
      namaPasangan: pax?.namaPasangan || pax?.spouseName || '',
      pekerjaan: pax?.pekerjaan || '',
      alamatLengkap: pax?.alamatLengkap || '',
      pasporNo: pax?.pasporNo || '',
      pasporNama: pax?.pasporNama || '',
      pasporTempat: pax?.pasporTempat || '',
      pasporTglTerbit: pax?.pasporTglTerbit || '',
      pasporTglExpired: pax?.pasporTglExpired || '',
      kontakDaruratNama: pax?.kontakDaruratNama || '',
      kontakDaruratHubungan: pax?.kontakDaruratHubungan || '',
      kontakDaruratPhone: pax?.kontakDaruratPhone || '',
      riwayatMedisPenyakit: medicalList,
      riwayatMedisDetail: pax?.riwayatMedisDetail || pax?.medicalHistoryDetails || '',
    };
  };

  const [form, setForm] = useState(() => getFormDataFromPax(activePax));

  const handleToggleDisease = (disease: string) => {
    setForm(prev => {
      let currentList = [...(prev.riwayatMedisPenyakit || [])];
      if (disease === 'Sehat / Tidak ada') {
        return {
          ...prev,
          riwayatMedisPenyakit: ['Sehat / Tidak ada'],
          riwayatMedisDetail: ''
        };
      } else {
        currentList = currentList.filter(item => item !== 'Sehat / Tidak ada');
        if (currentList.includes(disease)) {
          currentList = currentList.filter(item => item !== disease);
        } else {
          currentList.push(disease);
        }
        if (currentList.length === 0) {
          currentList = ['Sehat / Tidak ada'];
        }
        return {
          ...prev,
          riwayatMedisPenyakit: currentList
        };
      }
    });
  };
  // Default to active edit mode if active pax is incomplete or name/nik is blank
  const [isEditing, setIsEditing] = useState<boolean>(() => !activePax?.isComplete || !activePax?.userName);
  const [isForcedEdit, setIsForcedEdit] = useState(false);

  // Sync form when active pax index changes
  useEffect(() => {
    if (activePax) {
      setForm(getFormDataFromPax(activePax));
      
      if (isForcedEdit) {
        setIsEditing(true);
        // We will reset isForcedEdit after the submenu effect runs or here
      } else {
        // Auto enable editing mode if data is empty/unfilled
        setIsEditing(!activePax.isComplete || !activePax.userName);
      }
    }
  }, [activePaxIdx, paxList, isForcedEdit]);

  const handleSelectPax = (index: number) => {
    setActivePaxIdx(index);
  };

  const handleAddPax = () => {
    const nextNo = paxList.filter(p => p.registrationId === (tempRegInfo?.registrationId || 'REG-LEGACY')).length + 1;
    const newPax = createBlankPax(
      nextNo, 
      tempRegInfo?.registrationId || 'REG-LEGACY',
      tempRegInfo?.packageName,
      tempRegInfo?.packagePrice
    );

    const updated = [newPax, ...paxList];
    setPaxList(updated);
    setActivePaxIdx(0);
    setIsEditing(true);

    toast.success(`Slot Jamaah #${nextNo} baru berhasil ditambahkan ke kategori rombongan saat ini!`);
  };

  const handleClearForm = () => {
    setForm({
      userName: '',
      userPhone: '',
      userEmail: '',
      nik: '',
      tempatLahir: '',
      tanggalLahir: '',
      jenisKelamin: 'Laki-laki',
      statusPernikahan: 'Menikah',
      namaPasangan: '',
      pekerjaan: '',
      alamatLengkap: '',
      pasporNo: '',
      pasporNama: '',
      pasporTempat: '',
      pasporTglTerbit: '',
      pasporTglExpired: '',
      kontakDaruratNama: '',
      kontakDaruratHubungan: '',
      kontakDaruratPhone: '',
    });
    toast.info('Seluruh kolom isian formulir jemaah ini telah dikosongkan.');
  };

  const handleRemovePax = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    let updated: any[];
    if (paxList.length <= 1) {
      const blank = createBlankPax(1);
      updated = [blank];
      setPaxList(updated);
      setActivePaxIdx(0);
      setForm(getFormDataFromPax(blank));
      setIsEditing(true);
      toast.info('Data jemaah berhasil dihapus dari Mitra & Portal Admin. Formulir dikembalikan ke kondisi kosong.');
    } else {
      const targetPax = paxList[index];
      const targetRegId = targetPax?.registrationId;
      
      const filtered = paxList.filter((_, idx) => idx !== index);
      
      // Re-sequence only within the same group
      let groupCounter = 1;
      updated = filtered.map((item) => {
        if (item.registrationId === targetRegId) {
          return { ...item, paxNo: groupCounter++ };
        }
        return item;
      });
      
      setPaxList(updated);
      const nextActiveIdx = Math.max(0, Math.min(activePaxIdx, updated.length - 1));
      setActivePaxIdx(nextActiveIdx);
      if (updated[nextActiveIdx]) {
        setForm(getFormDataFromPax(updated[nextActiveIdx]));
      }
      toast.info('Slot & data jemaah berhasil dihapus dari Mitra & Portal Admin.');
    }

    if (tempRegInfo) {
      const updatedInfo = { ...tempRegInfo, paxCount: updated.length };
      setTempRegInfo(updatedInfo);
      localStorage.setItem('selected_mitra_package', JSON.stringify(updatedInfo));
    }

    syncToCentralDatabase(updated);
  };

  const syncToCentralDatabase = (updatedPaxList: any[]) => {
    try {
      const activeMitra = getActiveMitraInfo();
      const scopedKey = getScopedKey('mitra_saved_pax_list');
      localStorage.setItem(scopedKey, JSON.stringify(updatedPaxList));

      const currentMitraId = (mitraInfo.id && mitraInfo.id !== 'mitra-user') 
        ? mitraInfo.id 
        : (activeMitra.id && activeMitra.id !== 'mitra-user') 
          ? activeMitra.id 
          : activeMitra.email || localStorage.getItem('current_mitra_id') || localStorage.getItem('current_mitra_email') || 'mitra-user';

      const currentMitraName = (mitraInfo.name && mitraInfo.name !== 'Mitra Travel')
        ? mitraInfo.name
        : (activeMitra.name && activeMitra.name !== 'Mitra Travel')
          ? activeMitra.name
          : localStorage.getItem('current_mitra_name') || 'Mitra Travel';

      const currentMitraLevel = mitraInfo.level || 'Mitra';
      const currentMitraPhone = mitraInfo.phone || '';
      const currentMitraEmail = mitraInfo.email || activeMitra.email || localStorage.getItem('current_mitra_email') || '';

      const currentPkgName = tempRegInfo?.packageName || activePax?.packageName || 'Paket Umroh Executive 12 Hari';
      const currentPkgPrice = tempRegInfo?.packagePrice || 32500000;

      let centralDb: any[] = [];
      try {
        const stored = localStorage.getItem('mitra_jamaah_database');
        if (stored) centralDb = JSON.parse(stored);
      } catch (e) {}

      // Keep records belonging to other mitras cleanly
      const isSameMitraRecord = (j: any) => {
        if (!j) return false;
        const jId = (j.mitraId || '').trim();
        const jEmail = (j.mitraEmail || '').toLowerCase().trim();
        const jName = (j.mitraName || j.ordererName || '').trim();

        const cId = (currentMitraId || '').trim();
        const cEmail = (currentMitraEmail || '').toLowerCase().trim();
        const cName = (currentMitraName || '').trim();

        // 1. Match by Email if both are present
        if (cEmail && jEmail && cEmail === jEmail) {
          return true;
        }

        // 2. Match by ID if both are present and not generic 'mitra-user'
        if (
          cId && 
          cId.toLowerCase() !== 'mitra-user' && 
          jId && 
          jId.toLowerCase() !== 'mitra-user' && 
          cId.toLowerCase() === jId.toLowerCase()
        ) {
          return true;
        }

        // 3. Match by Name if both are present and not generic 'Mitra' / 'Mitra Travel'
        const cleanCName = cName.toLowerCase().replace('mitra:', '').trim();
        const cleanJName = jName.toLowerCase().replace('mitra:', '').trim();
        if (
          cleanCName && 
          cleanJName && 
          cleanCName !== 'mitra' && 
          cleanCName !== 'mitra travel' && 
          cleanJName !== 'mitra' && 
          cleanJName !== 'mitra travel' && 
          cleanCName === cleanJName
        ) {
          return true;
        }

        return false;
      };

      const otherMitraRecords = centralDb.filter((j) => !isSameMitraRecord(j));

      const now = new Date();
      // Only sync entries that have a name or are marked complete, to avoid cluttering Admin with empty slots
      const thisMitraRecords = updatedPaxList
        .filter(p => p.userName && p.userName.trim() !== '')
        .map((p, idx) => {
          const isActuallyComplete = p.userName && p.userName.trim() !== '' && p.isComplete;
          const jamaahId = p.id || `JAM-10${idx + 1}`;
          
          // CRITICAL: Preserve verification status if it exists in central DB
          const existingRecord = centralDb.find(ex => ex.id === jamaahId);
          const currentStatus = existingRecord?.statusBiodata || p.statusBiodata || (isActuallyComplete ? 'verified' : 'pending');
          const currentDocStatus = existingRecord?.statusDokumen || p.statusDokumen || 'pending';
          
          return {
            id: jamaahId,
            mitraId: currentMitraId,
            mitraName: currentMitraName,
            registrationId: p.registrationId || tempRegInfo?.registrationId || 'REG-LEGACY',
            mitraLevel: currentMitraLevel,
            mitraPhone: currentMitraPhone,
            mitraEmail: currentMitraEmail,
            ordererName: currentMitraName,
            ordererPhone: currentMitraPhone,
            ordererEmail: currentMitraEmail,
            userName: p.userName,
            userPhone: p.userPhone || '-',
            userEmail: p.userEmail || '-',
            nik: p.nik || '-',
            paxCount: p.paxCount || tempRegInfo?.paxCount || 1,
            jumlahPax: p.paxCount || tempRegInfo?.paxCount || 1,
            packageName: p.packageName || currentPkgName,
            packagePrice: p.packagePrice || currentPkgPrice,
            departureDate: p.departureDate || tempRegInfo?.departureDate || '-',
            statusBiodata: currentStatus,
            statusDokumen: currentDocStatus,
            isComplete: isActuallyComplete,
            paxNo: p.paxNo || idx + 1,
          registeredAt: p.registeredAt || now.toISOString(),
          registeredAtFormatted: p.registeredAtFormatted || now.toLocaleString('id-ID'),
          // Include sub-objects
          documents: p.documents || p.docs || {
            ktp: { status: 'pending', url: '' },
            kk: { status: 'pending', url: '' },
            paspor: { status: 'pending', url: '' },
          },
          passportInfo: p.passportInfo || {},
          personalInfo: p.personalInfo || {},
          tempatLahir: p.tempatLahir || '-',
          tanggalLahir: p.tanggalLahir || '-',
          jenisKelamin: p.jenisKelamin || 'Laki-laki',
          statusPernikahan: p.statusPernikahan || 'Menikah',
          namaPasangan: p.namaPasangan || '',
          pekerjaan: p.pekerjaan || '-',
          alamatLengkap: p.alamatLengkap || '-',
          pasporNo: p.pasporNo || '-',
          pasporNama: p.pasporNama || (p.userName ? p.userName.toUpperCase() : '-'),
          pasporTempat: p.pasporTempat || '-',
          pasporTglTerbit: p.pasporTglTerbit || '-',
          pasporTglExpired: p.pasporTglExpired || '-',
          kontakDaruratNama: p.kontakDaruratNama || '-',
          kontakDaruratHubungan: p.kontakDaruratHubungan || '-',
          kontakDaruratPhone: p.kontakDaruratPhone || '-',
          payments: (existingRecord?.payments && existingRecord.payments.length > 0) ? existingRecord.payments : (p.payments || []),
          totalPaid: existingRecord?.totalPaid ?? p.totalPaid ?? ((p.packagePrice || currentPkgPrice) * 0.3),
          paymentStep: existingRecord?.paymentStep || p.paymentStep || 'dp1',
          statusPayment: existingRecord?.statusPayment || p.statusPayment || 'pending',
          riwayatMedisPenyakit: p.riwayatMedisPenyakit || p.medicalConditions || ['Sehat / Tidak ada'],
          riwayatMedisDetail: p.riwayatMedisDetail || p.medicalHistoryDetails || '',
          equipment: p.equipment || {
            koper: true,
            tasPaspor: true,
            kainIhram: true,
            seragamBatik: false
          },
          issuedDocs: p.issuedDocs || {
            tiketPesawat: true,
            visaUmroh: false,
            hotelVoucher: false,
            idCardDigital: true
          }
        };
      });

      const newCentralDb = [...thisMitraRecords, ...otherMitraRecords];
      localStorage.setItem('mitra_jamaah_database', JSON.stringify(newCentralDb));

      // Trigger custom sync event
      window.dispatchEvent(new Event('mitra_jamaah_updated'));
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  const handleSavePax = () => {
    if (!form.userName || form.userName.trim() === '') {
      toast.error('Mohon isi Nama Lengkap Calon Jamaah terlebih dahulu sebelum menyimpan.');
      return;
    }

    const savedName = form.userName.trim();

    const medArr = form.riwayatMedisPenyakit && form.riwayatMedisPenyakit.length > 0
      ? form.riwayatMedisPenyakit
      : ['Sehat / Tidak ada'];
    const medCondStr = medArr.join(', ');
    const medFullStr = form.riwayatMedisDetail && !medArr.includes('Sehat / Tidak ada')
      ? `${medCondStr} (Detail: ${form.riwayatMedisDetail})`
      : (form.riwayatMedisDetail ? form.riwayatMedisDetail : medCondStr);

    const now = new Date();
    const savedItem = {
      ...paxList[activePaxIdx],
      ...form,
      userName: savedName,
      pasporNama: form.pasporNama || savedName.toUpperCase(),
      namaPasangan: form.namaPasangan || form.spouseName || '',
      spouseName: form.namaPasangan || form.spouseName || '',
      riwayatMedisPenyakit: medArr,
      riwayatMedisDetail: form.riwayatMedisDetail || '',
      riwayatMedis: medCondStr,
      medicalHistory: medFullStr,
      medicalHistoryDetails: form.riwayatMedisDetail || '',
      medicalConditions: medArr,
      statusBiodata: paxList[activePaxIdx]?.statusBiodata === 'verified' ? 'verified' : 'pending',
      isComplete: true,
      registeredAt: now.toISOString(),
      registeredAtFormatted: now.toLocaleString('id-ID', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      })
    };

    const updated = paxList.map((item, idx) => {
      if (idx === activePaxIdx) {
        return savedItem;
      }
      return item;
    });

    // Sync to central DB
    syncToCentralDatabase(updated);
    
    // Update local state
    setPaxList(updated);
    setIsEditing(false);

    toast.success(`Biodata ${savedName} berhasil disimpan ke sistem!`);

    // Check if group is complete
    const currentRegId = savedItem.registrationId;
    const group = updated.filter(p => p.registrationId === currentRegId);
    const allGroupComplete = group.every(p => p.isComplete);

    if (allGroupComplete) {
      toast.success('Pendaftaran Rombongan Selesai! Formulir akan direset.');
      setTimeout(() => {
        setRegFlowStep('select_package');
        setTempRegInfo({ packageId: '', packageName: '', packagePrice: 0, paxCount: 1, registrationId: `REG-${Date.now()}` });
      }, 1500);
    } else {
      // Find next incomplete slot in group
      const nextIdxInGroup = group.findIndex(p => !p.isComplete);
      if (nextIdxInGroup !== -1) {
        const nextPaxId = group[nextIdxInGroup].id;
        const globalIdx = updated.findIndex(p => p.id === nextPaxId);
        if (globalIdx !== -1) {
          setActivePaxIdx(globalIdx);
          setIsEditing(true);
        }
      }
    }
  };

  const handleDownloadPdf = () => {
    try {
      const pkgName = tempRegInfo?.packageName || activePax?.packageName || 'Paket Umroh Executive 12 Hari';
      // Only download for the active group if one is selected
      const currentGroupPax = activeGroupId !== 'all' 
        ? paxList.filter(p => p.registrationId === activeGroupId)
        : paxList;

      const filledPaxList = currentGroupPax.filter(p => p.userName && p.userName.trim() !== '');
      const listToPdf = filledPaxList.length > 0 ? filledPaxList : [activePax];

      generateRegistrationFormPdf({
        id: activePax?.id || `JAM-${Date.now()}`,
        ordererName: mitraInfo.name,
        ordererPhone: mitraInfo.phone,
        ordererEmail: mitraInfo.email,
        mitraName: mitraInfo.name,
        mitraPhone: mitraInfo.phone,
        mitraEmail: mitraInfo.email,
        packageName: pkgName,
        paxCount: listToPdf.length,
        paxData: listToPdf.map((p, idx) => {
          const isCur = idx === activePaxIdx;
          const pMedList = isCur 
            ? (form.riwayatMedisPenyakit || ['Sehat / Tidak ada'])
            : (p.riwayatMedisPenyakit || p.medicalConditions || [p.riwayatMedis || p.medicalHistory || 'Sehat / Tidak ada']);
          const pMedStr = Array.isArray(pMedList) ? pMedList.join(', ') : String(pMedList);
          const pMedDetail = isCur ? form.riwayatMedisDetail : (p.riwayatMedisDetail || p.medicalHistoryDetails || '');

          const finalMedStr = (pMedDetail && pMedStr !== 'Sehat / Tidak ada')
            ? `${pMedStr} (Detail: ${pMedDetail})`
            : (pMedDetail ? pMedDetail : pMedStr);

          return {
            fullName: (isCur ? form.userName : p.userName) || `Jamaah #${idx + 1}`,
            nik: (isCur ? form.nik : p.nik) || '-',
            pob: (isCur ? form.tempatLahir : p.tempatLahir) || '-',
            dob: (isCur ? form.tanggalLahir : p.tanggalLahir) || '-',
            tempatLahir: (isCur ? form.tempatLahir : p.tempatLahir) || '-',
            tanggalLahir: (isCur ? form.tanggalLahir : p.tanggalLahir) || '-',
            gender: (isCur ? form.jenisKelamin : p.jenisKelamin) || '-',
            jenisKelamin: (isCur ? form.jenisKelamin : p.jenisKelamin) || '-',
            maritalStatus: (isCur ? form.statusPernikahan : p.statusPernikahan) || '-',
            statusPernikahan: (isCur ? form.statusPernikahan : p.statusPernikahan) || '-',
            spouseName: (isCur ? form.namaPasangan : p.namaPasangan) || (isCur ? form.spouseName : p.spouseName) || '-',
            namaPasangan: (isCur ? form.namaPasangan : p.namaPasangan) || (isCur ? form.spouseName : p.spouseName) || '-',
            address: (isCur ? form.alamatLengkap : p.alamatLengkap) || '-',
            alamatLengkap: (isCur ? form.alamatLengkap : p.alamatLengkap) || '-',
            passportNo: (isCur ? form.pasporNo : p.pasporNo) || '-',
            pasporNo: (isCur ? form.pasporNo : p.pasporNo) || '-',
            passportOffice: (isCur ? form.pasporTempat : p.pasporTempat) || '-',
            pasporTempat: (isCur ? form.pasporTempat : p.pasporTempat) || '-',
            passportExpiryDate: (isCur ? form.pasporTglExpired : p.pasporTglExpired) || (isCur ? form.pasporExpired : p.pasporExpired) || '-',
            pasporExpired: (isCur ? form.pasporTglExpired : p.pasporTglExpired) || (isCur ? form.pasporExpired : p.pasporExpired) || '-',
            emergencyName: (isCur ? form.kontakDaruratNama : p.kontakDaruratNama) || '-',
            kontakDaruratNama: (isCur ? form.kontakDaruratNama : p.kontakDaruratNama) || '-',
            emergencyRelation: (isCur ? form.kontakDaruratHubungan : p.kontakDaruratHubungan) || '-',
            kontakDaruratHubungan: (isCur ? form.kontakDaruratHubungan : p.kontakDaruratHubungan) || '-',
            emergencyPhone: (isCur ? form.kontakDaruratPhone : p.kontakDaruratPhone) || '-',
            kontakDaruratPhone: (isCur ? form.kontakDaruratPhone : p.kontakDaruratPhone) || '-',
            riwayatMedisPenyakit: pMedList,
            riwayatMedisDetail: pMedDetail,
            medicalHistory: finalMedStr,
            medicalHistoryDetails: pMedDetail,
          };
        })
      });
      toast.success(`Formulir Pendaftaran PDF (${listToPdf.length} Jamaah) berhasil dibuat & diunduh!`);
    } catch (e) {
      console.error(e);
      toast.error('Gagal membuat PDF.');
    }
  };

  const currentGroupMembers = activeGroupId !== 'all' ? groupedPax[activeGroupId] || [] : paxList;
  const currentPackageName = (activeGroupId !== 'all' && groupedPax[activeGroupId]?.[0]?.packageName) || tempRegInfo?.packageName || activePax?.packageName || 'Paket Umroh Executive 12 Hari';
  const currentPackagePrice = (activeGroupId !== 'all' && groupedPax[activeGroupId]?.[0]?.packagePrice) || tempRegInfo?.packagePrice || 32500000;
  const currentGroupPaxCount = activeGroupId !== 'all' ? currentGroupMembers.length : paxList.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* SECTION BANNER: SELECTED PACKAGE & PAX SUMMARY */}
      <div className="p-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-[2.5rem] shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-10 -translate-y-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-widest">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> PAKET IBADAH TERPILIH
            </div>
            <h2 className="text-2xl font-playfair font-bold text-white tracking-tight">{currentPackageName}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-emerald-100/90">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                Rp {Number(currentPackagePrice).toLocaleString('id-ID')} / pax
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-bold text-amber-300">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Total Slot Didaftarkan: {currentGroupPaxCount} Jamaah {activeGroupId !== 'all' ? '(Rombongan Ini)' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                localStorage.removeItem('selected_mitra_package');
                setTempRegInfo(null);
                toast.info('Silakan pilih paket lain pada katalog.');
              }}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Pilih Paket Lain
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-5 py-2.5 rounded-2xl bg-amber-400 text-emerald-950 font-black text-xs uppercase tracking-wider hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2 active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-950" /> Unduh Formulir PDF
            </button>
          </div>
        </div>
      </div>

      {/* SUBMENU NAVIGATION TABS FOR MITRA */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setSubmenuTab('input')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            submenuTab === 'input' 
              ? 'bg-emerald-900 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Edit2 className="w-4 h-4 text-amber-400" />
          <span>Formulir Input & Edit Jemaah</span>
        </button>
        <button
          type="button"
          onClick={() => setSubmenuTab('rekap')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            submenuTab === 'rekap' 
              ? 'bg-emerald-900 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Submenu Rekap Jamaah Terinput ({paxList.filter(p => p.isComplete).length})</span>
        </button>
      </div>

        {submenuTab === 'rekap' ? (
          /* SUBMENU VIEW: REKAP JAMAAH (HISTORY/REPORTS) */
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-8 min-h-[600px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div>
                <h3 className="text-2xl font-black text-slate-900 font-playfair tracking-tight mb-1.5 flex items-center gap-3">
                  <FileText className="w-8 h-8 text-emerald-700" />
                  Rekapitulasi Pendaftaran Jemaah
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Laporan akumulasi data jemaah yang telah didaftarkan melalui Panel Mitra Anda.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="date"
                    value={reportFilterDate}
                    onChange={(e) => setReportFilterDate(e.target.value)}
                    className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                  />
                </div>
                <div className="relative">
                  <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Cari Nama / ID..."
                    value={reportSearchTerm}
                    onChange={(e) => setReportSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm min-w-[180px]"
                  />
                </div>
                {paxList.some(p => p.isComplete) && (
                  <button
                    onClick={handleDownloadPdf}
                    className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-lg flex items-center gap-2 active:scale-95"
                  >
                    <Download className="w-4 h-4 text-amber-400" /> Export PDF
                  </button>
                )}
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="py-24 text-center space-y-6 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                <div className="w-20 h-20 bg-white text-slate-300 rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                  <FileText className="w-10 h-10" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">Tidak Ada Data Ditemukan</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed px-8">
                    Silakan sesuaikan filter pencarian atau tanggal pendaftaran untuk menemukan data jemaah yang Anda cari.
                  </p>
                </div>
                {reportFilterDate || reportSearchTerm ? (
                  <button 
                    onClick={() => { setReportFilterDate(''); setReportSearchTerm(''); }}
                    className="text-emerald-700 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1.5 mx-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Filter
                  </button>
                ) : (
                  <button
                    onClick={() => setSubmenuTab('input')}
                    className="px-6 py-3 rounded-2xl bg-emerald-950 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-xl inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-amber-400" /> Daftar Jemaah Baru
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-[2rem] shadow-inner bg-slate-50/30">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                      <th className="py-6 px-8">ID & Tgl Daftar</th>
                      <th className="py-6 px-8">Nama Lengkap & NIK</th>
                      <th className="py-6 px-8">Paket Umrah/Haji</th>
                      <th className="py-6 px-8 text-center">Status</th>
                      <th className="py-6 px-8 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistory.map((pax) => (
                      <tr key={pax.id} className="group hover:bg-white hover:shadow-md transition-all">
                        <td className="py-6 px-8">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">{pax.registrationId}</span>
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span className="text-[10px] font-bold">{pax.registeredAtFormatted || 'Tgl Tidak Tersedia'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-900 block group-hover:text-emerald-900 transition-colors">{pax.userName}</span>
                              <span className="text-[10px] font-mono font-bold text-slate-400">NIK: {pax.nik || '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-2">
                            <Luggage className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs font-bold text-slate-700">{pax.packageName || 'Paket Umum'}</span>
                          </div>
                        </td>
                        <td className="py-6 px-8 text-center">
                          {pax.statusBiodata === 'verified' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> TERVERIFIKASI
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black border border-amber-200">
                              <Clock className="w-3 h-3" /> PENDING
                            </span>
                          )}
                        </td>
                        <td className="py-6 px-8 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                const globalIdx = paxList.findIndex(p => p.id === pax.id);
                                if (globalIdx !== -1) {
                                  if (pax.registrationId) setActiveGroupId(pax.registrationId);
                                  setIsForcedEdit(true);
                                  setActivePaxIdx(globalIdx);
                                  setSubmenuTab('input');
                                  setRegFlowStep('biodata');
                                  setIsEditing(true);
                                }
                              }}
                              className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-900 hover:text-white transition-all active:scale-90"
                              title="Edit Data"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleRemovePax(paxList.findIndex(p => p.id === pax.id), e)}
                              className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      ) : (
        /* SUBMENU VIEW: FORMULIR INPUT & EDIT PAX */
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* REGISTRATION CONTEXT HEADER (If group is active) */}
          {activeGroupId !== 'all' && (
            <div className="bg-emerald-950 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all">
                <Luggage className="w-40 h-40 -rotate-12" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-amber-400 text-emerald-950 text-[10px] font-black uppercase tracking-widest rounded-lg">
                      Registrasi Baru
                    </span>
                    <span className="text-emerald-300 font-mono text-xs font-bold">
                      ID: {activeGroupId}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black font-playfair tracking-tight">
                    {activeGroupPax[0]?.packageName || tempRegInfo.packageName}
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-bold text-emerald-200">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      Keberangkatan: {activeGroupPax[0]?.departureDate || tempRegInfo.departureDate || '-'}
                    </div>
                    <div className="flex items-center gap-1.5 border-l border-emerald-800 pl-4">
                      <Users className="w-4 h-4 text-amber-400" />
                      {activeGroupPax.length} Pax Rombongan
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Selesaikan Input Rombongan',
                      message: 'Apakah Anda ingin menyelesaikan input rombongan ini dan kembali ke daftar rekap seluruh jemaah?',
                      type: 'info',
                      confirmText: 'Selesai & Lihat Rekap',
                      onConfirm: () => {
                        setActiveGroupId('all');
                        setSubmenuTab('rekap');
                      }
                    });
                  }}
                  className="px-6 py-3 bg-white text-emerald-900 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-emerald-50 transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  Selesai & Lihat Rekap
                </button>
              </div>
            </div>
          )}

          {/* PASSENGER SLOT SELECTOR - Horizontal Pills */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pilih Jamaah Untuk Input Biodata</h4>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                {activeGroupPax.filter(p => p.isComplete).length} / {activeGroupPax.length} Selesai
              </span>
            </div>
            
            <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-thin snap-x">
              {activeGroupPax.filter(p => !p.isComplete || activePax?.id === p.id).map((p) => {
                const isSelected = activePax?.id === p.id;
                const globalIdx = paxList.findIndex(item => item.id === p.id);
                
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePaxIdx(globalIdx)}
                    className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] border-2 transition-all whitespace-nowrap group snap-start relative ${
                      isSelected ? 'border-emerald-600 bg-white shadow-xl -translate-y-1' : 
                      p.isComplete ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${
                      isSelected ? 'bg-emerald-900 text-white rotate-6' : 
                      p.isComplete ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {p.isComplete ? <Check className="w-5 h-5" /> : p.paxNo}
                    </div>
                    <div className="text-left">
                      <span className={`text-[11px] font-black uppercase tracking-wider block ${isSelected ? 'text-emerald-900' : 'text-slate-600'}`}>
                        {p.userName || `Jamaah #${p.paxNo}`}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${p.isComplete ? 'text-emerald-500' : 'text-slate-300'}`}>
                        {p.isComplete ? 'Biodata Terisi' : 'Siap Input'}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-ping" />
                    )}
                  </button>
                );
              })}
              
              {activeGroupId !== 'all' && (
                <button
                  onClick={handleAddPax}
                  className="flex items-center gap-3 px-6 py-4 rounded-[2rem] border-2 border-dashed border-emerald-200 bg-emerald-50/10 hover:bg-emerald-50 hover:border-emerald-400 transition-all whitespace-nowrap text-emerald-600 group snap-start"
                >
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 shadow-sm transition-all">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] font-black uppercase tracking-widest block">Tambah Jamaah</span>
                    <span className="text-[9px] font-bold text-emerald-500/70">Klik Untuk Slot Baru</span>
                  </div>
                </button>
              )}
              
              {activeGroupId === 'all' && (
                <button
                  onClick={() => setRegFlowStep('select_package')}
                  className="flex items-center gap-3 px-6 py-4 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-emerald-300 transition-all whitespace-nowrap text-slate-400 hover:text-emerald-600 group snap-start"
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest">Tambah Rombongan</span>
                </button>
              )}
            </div>
          </div>

        {/* MAIN BIODATA & PASPOR FORM FOR ACTIVE PAX */}
        {regFlowStep === 'biodata' && (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-8 min-h-[600px] animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-900 text-amber-400 rounded-xl border border-emerald-800 shadow-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 font-playfair tracking-tight">
                Data Jamaah #{paxList[activePaxIdx]?.paxNo || activePaxIdx + 1}
              </h3>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  {paxList[activePaxIdx]?.packageName || tempRegInfo.packageName}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Keberangkatan: <strong className="text-slate-600">{paxList[activePaxIdx]?.departureDate || tempRegInfo.departureDate || '-'}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isEditing && (
              <button
                type="button"
                onClick={handleClearForm}
                className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-all border border-red-200 flex items-center gap-1.5"
                title="Kosongkan seluruh isian formulir"
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-600" /> Kosongkan Form
              </button>
            )}

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 border border-slate-200"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-600" /> Edit Data Jamaah Ini
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-all"
                >
                  Tutup
                </button>
                <button
                  onClick={handleSavePax}
                  className="px-4 py-2 rounded-xl bg-emerald-900 text-white font-bold text-xs hover:bg-emerald-800 transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" /> Simpan Jamaah Ini
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 0: DATA PEMESAN / PENANGGUNG JAWAB (MITRA AGEN) */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50/40 p-5 rounded-2xl border border-emerald-200/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                Data Pemesan / Penanggung Jawab (Mitra Agen)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-900 text-white font-extrabold text-[10px] uppercase tracking-wider">
                Penanggung Jawab Pendaftaran
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Seluruh calon jemaah yang diinput pada formulir ini terdaftar di bawah penanggung jawab Mitra Agen berikut dan tersinkronisasi otomatis ke Portal Admin.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/80 p-3.5 rounded-xl border border-emerald-100 shadow-sm text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Nama Mitra Penanggung Jawab</span>
              <span className="font-extrabold text-slate-900">{mitraInfo.name || '(Mitra Agen)'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Telepon / WhatsApp Mitra</span>
              <span className="font-bold text-slate-900">{mitraInfo.phone || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Email Resmi Mitra</span>
              <span className="font-bold text-slate-900">{mitraInfo.email || '-'}</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: DATA DIRI */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span> 1. Data Diri Sesuai KTP
          </h3>

          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/60 p-6 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Pendaftaran</p>
                <p className="text-sm font-bold text-emerald-700">
                  {form.registeredAt ? new Date(form.registeredAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</p>
                <p className={`text-sm font-bold ${form.userName ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {form.userName || '(Belum diisi)'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NIK (No. KTP)</p>
                <p className={`text-sm font-bold ${form.nik ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {form.nik || '(Belum diisi)'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tempat / Tgl Lahir</p>
                <p className={`text-sm font-bold ${(form.tempatLahir || form.tanggalLahir) ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {(form.tempatLahir || form.tanggalLahir) ? `${form.tempatLahir || '-'}, ${form.tanggalLahir || '-'}` : '(Belum diisi)'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenis Kelamin</p>
                <p className="text-sm font-bold text-slate-900">{form.jenisKelamin}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Pernikahan</p>
                <p className="text-sm font-bold text-slate-900">{form.statusPernikahan}</p>
              </div>
              {form.statusPernikahan === 'Menikah' && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Pasangan (Suami/Istri)</p>
                  <p className={`text-sm font-bold ${form.namaPasangan ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                    {form.namaPasangan || '(Belum diisi)'}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pekerjaan</p>
                <p className={`text-sm font-bold ${form.pekerjaan ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {form.pekerjaan || '(Belum diisi)'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No. WhatsApp / Telepon</p>
                <p className={`text-sm font-bold ${form.userPhone ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {form.userPhone || '(Belum diisi)'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                <p className={`text-sm font-bold ${form.userEmail ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {form.userEmail || '(Belum diisi)'}
                </p>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat Lengkap</p>
                <p className={`text-sm font-bold ${form.alamatLengkap ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {form.alamatLengkap || '(Belum diisi)'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Pendaftaran</label>
                <input
                  type="date"
                  value={form.registeredAt ? new Date(form.registeredAt).toISOString().split('T')[0] : ''}
                  onChange={(e) => setForm({ ...form, registeredAt: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap (Sesuai KTP)</label>
                <input
                  type="text"
                  value={form.userName}
                  placeholder="Masukkan nama lengkap jemaah"
                  onChange={(e) => setForm({ ...form, userName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">NIK (16 Digit KTP)</label>
                <input
                  type="text"
                  value={form.nik}
                  placeholder="Masukkan 16 digit NIK"
                  onChange={(e) => setForm({ ...form, nik: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tempat Lahir</label>
                <input
                  type="text"
                  value={form.tempatLahir}
                  placeholder="Contoh: Jakarta"
                  onChange={(e) => setForm({ ...form, tempatLahir: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Lahir</label>
                <input
                  type="date"
                  value={form.tanggalLahir}
                  onChange={(e) => setForm({ ...form, tanggalLahir: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Jenis Kelamin</label>
                <select
                  value={form.jenisKelamin}
                  onChange={(e) => setForm({ ...form, jenisKelamin: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Status Pernikahan</label>
                <select
                  value={form.statusPernikahan}
                  onChange={(e) => setForm({ ...form, statusPernikahan: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="Menikah">Menikah</option>
                  <option value="Belum Menikah">Belum Menikah</option>
                  <option value="Janda/Duda">Janda / Duda</option>
                </select>
              </div>
              {form.statusPernikahan === 'Menikah' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Pasangan (Suami / Istri)</label>
                  <input
                    type="text"
                    value={form.namaPasangan}
                    placeholder="Masukkan nama suami / istri"
                    onChange={(e) => setForm({ ...form, namaPasangan: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white placeholder:text-slate-300"
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">No. WA / Telepon</label>
                <input
                  type="text"
                  value={form.userPhone}
                  placeholder="Contoh: 081234567890"
                  onChange={(e) => setForm({ ...form, userPhone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Email Jemaah</label>
                <input
                  type="email"
                  value={form.userEmail}
                  placeholder="Contoh: jemaah@email.com"
                  onChange={(e) => setForm({ ...form, userEmail: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Pekerjaan</label>
                <input
                  type="text"
                  value={form.pekerjaan}
                  placeholder="Contoh: Wiraswasta / PNS / Karyawan"
                  onChange={(e) => setForm({ ...form, pekerjaan: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white placeholder:text-slate-300"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Alamat Lengkap</label>
                <input
                  type="text"
                  value={form.alamatLengkap}
                  placeholder="Masukkan alamat domisili RT/RW, Kelurahan, Kecamatan, Kota"
                  onChange={(e) => setForm({ ...form, alamatLengkap: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white placeholder:text-slate-300"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: DATA PASPOR */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> 2. Data Paspor RI
          </h3>

          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-amber-50/40 p-6 rounded-2xl border border-amber-200/50">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nomor Paspor</p>
                <p className={`text-sm font-bold ${form.pasporNo ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {form.pasporNo || '(Belum diisi)'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap di Paspor</p>
                <p className={`text-sm font-bold ${form.pasporNama ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {form.pasporNama || '(Belum diisi)'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tempat Terbit</p>
                <p className={`text-sm font-bold ${form.pasporTempat ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {form.pasporTempat || '(Belum diisi)'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Terbit</p>
                <p className={`text-sm font-bold ${form.pasporTglTerbit ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {form.pasporTglTerbit || '(Belum diisi)'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Masa Berlaku S/d</p>
                <p className={`text-sm font-bold ${form.pasporTglExpired ? 'text-emerald-800' : 'text-slate-400 italic'}`}>
                  {form.pasporTglExpired || '(Belum diisi)'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Paspor</p>
                {form.pasporNo ? (
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                    PASPOR TERISI
                  </span>
                ) : (
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200">
                    BELUM ADA PASPOR
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-amber-50/50 p-6 rounded-2xl border border-amber-200/60">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nomor Paspor</label>
                <input
                  type="text"
                  value={form.pasporNo}
                  placeholder="Contoh: A1234567"
                  onChange={(e) => setForm({ ...form, pasporNo: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-amber-500 bg-white placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap di Paspor</label>
                <input
                  type="text"
                  value={form.pasporNama}
                  placeholder="Nama sesuai tertera di Paspor"
                  onChange={(e) => setForm({ ...form, pasporNama: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-amber-500 bg-white placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tempat Terbit Paspor</label>
                <input
                  type="text"
                  value={form.pasporTempat}
                  placeholder="Contoh: Imigrasi Jakarta Pusat"
                  onChange={(e) => setForm({ ...form, pasporTempat: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-amber-500 bg-white placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Terbit Paspor</label>
                <input
                  type="date"
                  value={form.pasporTglTerbit}
                  onChange={(e) => setForm({ ...form, pasporTglTerbit: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-amber-500 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Kadaluarsa Paspor</label>
                <input
                  type="date"
                  value={form.pasporTglExpired}
                  onChange={(e) => setForm({ ...form, pasporTglExpired: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-amber-500 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: KONTAK DARURAT */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> 3. Kontak Darurat & Mahram
          </h3>

          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-50/60 p-6 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Kontak Darurat</p>
                <p className={`text-sm font-bold ${form.kontakDaruratNama ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {form.kontakDaruratNama || '(Belum diisi)'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hubungan Keluarga</p>
                <p className={`text-sm font-bold ${form.kontakDaruratHubungan ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {form.kontakDaruratHubungan || '(Belum diisi)'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No. Telepon / WA</p>
                <p className={`text-sm font-bold ${form.kontakDaruratPhone ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {form.kontakDaruratPhone || '(Belum diisi)'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Kontak Darurat</label>
                <input
                  type="text"
                  value={form.kontakDaruratNama}
                  placeholder="Masukkan nama kontak darurat"
                  onChange={(e) => setForm({ ...form, kontakDaruratNama: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Hubungan Keluarga</label>
                <input
                  type="text"
                  value={form.kontakDaruratHubungan}
                  placeholder="Contoh: Suami / Istri / Orang Tua"
                  onChange={(e) => setForm({ ...form, kontakDaruratHubungan: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">No. Telepon / WA</label>
                <input
                  type="text"
                  value={form.kontakDaruratPhone}
                  placeholder="Contoh: 081234567890"
                  onChange={(e) => setForm({ ...form, kontakDaruratPhone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white placeholder:text-slate-300"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: RIWAYAT MEDIS & CATATAN KESEHATAN */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> 4. Riwayat Medis & Penyakit Bawaan
          </h3>

          {!isEditing ? (
            <div className="bg-rose-50/40 p-6 rounded-2xl border border-rose-200/50 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Kondisi Kesehatan & Riwayat Penyakit Terpilih
                </p>
                <div className="flex flex-wrap gap-2">
                  {form.riwayatMedisPenyakit && form.riwayatMedisPenyakit.length > 0 ? (
                    form.riwayatMedisPenyakit.map((item: string, idx: number) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border shadow-xs ${
                          item === 'Sehat / Tidak ada'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}
                      >
                        <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                      Sehat / Tidak ada
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Catatan Detail / Konsumsi Obat Rutin (Kustom)
                </p>
                <p className={`text-xs font-bold leading-relaxed p-3 rounded-xl bg-white border border-rose-100 ${form.riwayatMedisDetail ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                  {form.riwayatMedisDetail || '(Tidak ada catatan medis kustom)'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-rose-50/30 p-6 rounded-2xl border border-rose-200/60 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                  Pilih Kondisi Kesehatan & Riwayat Penyakit Bawaan *
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Klik opsi penyakit bawaan jika jemaah memiliki riwayat medis tertentu (dapat memilih lebih dari satu), atau pilih <strong>"Sehat / Tidak ada"</strong>.
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {MEDICAL_OPTIONS.map((option) => {
                    const isSelected = form.riwayatMedisPenyakit?.includes(option);
                    const isHealthyOption = option === 'Sehat / Tidak ada';
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleToggleDisease(option)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-xs active:scale-95 ${
                          isSelected
                            ? isHealthyOption
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-600/20'
                              : 'bg-rose-600 text-white border-rose-700 shadow-rose-600/20'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Detail Catatan Riwayat Medis / Penyakit Bawaan (Kolom Input Kustom)
                </label>
                <textarea
                  rows={2}
                  value={form.riwayatMedisDetail}
                  onChange={(e) => setForm({ ...form, riwayatMedisDetail: e.target.value })}
                  placeholder="Contoh: Mengonsumsi obat hipertensi rutin Amlodipine 5mg setiap pagi, ada alergi obat Penisilin, dll."
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-rose-500 bg-white placeholder:text-slate-300 resize-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Kolom kustom ini wajib diisi jika memilih <strong>"Lainnya"</strong> atau untuk menyertakan detail obat rutin jemaah.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SAVE ALL BUTTON */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={handleSavePax}
            className="px-8 py-4 rounded-2xl bg-emerald-900 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-950/10 flex items-center gap-3 active:scale-95 group"
          >
            <CheckCircle2 className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" /> 
            Simpan Perubahan Biodata
          </button>
        </div>
      </div>
    )}
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

