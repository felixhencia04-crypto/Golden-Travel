import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Upload, FileText, Image as ImageIcon, CheckCircle2, 
  Trash2, ExternalLink, AlertCircle, AlertTriangle, FileCheck, Loader2, Link as LinkIcon, Users, User,
  Sparkles, Layers, ListFilter, Check, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { openDataUrlInNewTab } from '../../utils/file';

interface FinalDocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  registrationId: string;
  jamaahName: string;
  packageName?: string;
  docType: 'eticket' | 'visa' | 'asuransi';
  paxData?: any[];
  paxCount?: number;
  documents?: any[];
  existingDocUrl?: string;
  onSuccess: () => void;
}

const DOC_CONFIG = {
  eticket: {
    title: 'E-Ticket Keberangkatan',
    desc: 'Unggah file Tiket Pesawat final untuk keberangkatan jamaah.',
    recommendedFormat: 'PDF (Direkomendasikan) atau PNG/JPG',
    color: 'from-blue-600 to-indigo-700',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  visa: {
    title: 'Visa Umrah / Haji',
    desc: 'Unggah visa resmi jamaah yang diterbitkan Kementerian Haji KSA.',
    recommendedFormat: 'PDF (Direkomendasikan) atau PNG/JPG',
    color: 'from-emerald-600 to-teal-700',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  asuransi: {
    title: 'Polis Asuransi Perjalanan',
    desc: 'Unggah polis asuransi perjalanan & kesehatan jamaah.',
    recommendedFormat: 'PDF (Direkomendasikan) atau PNG/JPG',
    color: 'from-amber-600 to-orange-700',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200'
  }
};

interface StagedDoc {
  fileUrl: string;
  fileName?: string;
  isModified?: boolean;
}

export default function FinalDocumentUploadModal({
  isOpen,
  onClose,
  registrationId,
  jamaahName,
  packageName,
  docType,
  paxData,
  paxCount,
  documents = [],
  existingDocUrl,
  onSuccess
}: FinalDocumentUploadModalProps) {
  const [selectedTarget, setSelectedTarget] = useState<'group' | number>('group');
  const [viewMode, setViewMode] = useState<'single' | 'batch'>('batch');
  const [stagedDocs, setStagedDocs] = useState<Record<string, StagedDoc>>({});
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fileProcessingProgress, setFileProcessingProgress] = useState<number | null>(null);
  const [processingFileName, setProcessingFileName] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [targetToDelete, setTargetToDelete] = useState<string | null>(null);

  // Compute passenger list
  const rawPassengers = (paxData && Array.isArray(paxData) && paxData.length > 0)
    ? paxData.map((p, idx) => ({
        idx,
        name: p.fullName || p.name || (idx === 0 ? jamaahName : `Jamaah ${idx + 1}`),
        nik: p.nik || '-'
      }))
    : [{ idx: 0, name: jamaahName, nik: '-' }];

  const totalPaxNeeded = Math.max(paxCount || 1, rawPassengers.length);
  const passengers = [...rawPassengers];
  while (passengers.length < totalPaxNeeded) {
    const nextIdx = passengers.length;
    passengers.push({ idx: nextIdx, name: `Jamaah Pax ${nextIdx + 1}`, nik: '-' });
  }

  // Load initial documents into stagedDocs map
  useEffect(() => {
    if (isOpen) {
      const initialMap: Record<string, StagedDoc> = {};

      // 1. Group doc
      const groupFound = documents.find((d: any) => d.docType === docType);
      const groupUrl = groupFound?.fileUrl || existingDocUrl || '';
      if (groupUrl) {
        initialMap[docType] = { fileUrl: groupUrl, fileName: 'File Kolektif Group' };
      }

      // 2. Pax docs
      passengers.forEach((p) => {
        const key = `${docType}_pax_${p.idx}`;
        const paxFound = documents.find((d: any) => d.docType === key);
        if (paxFound && paxFound.fileUrl) {
          initialMap[key] = { fileUrl: paxFound.fileUrl, fileName: `${p.name} File` };
        }
      });

      setStagedDocs(initialMap);
      setUrlInput('');
      setShowDeleteConfirm(false);
      setTargetToDelete(null);

      // Default target
      if (passengers.length > 1) {
        setViewMode('batch');
        setSelectedTarget('group');
      } else {
        setViewMode('single');
        setSelectedTarget('group');
      }
    }
  }, [isOpen, docType, registrationId]);

  if (!isOpen) return null;

  const config = DOC_CONFIG[docType] || {
    title: docType.toUpperCase(),
    desc: 'Unggah dokumen final keberangkatan.',
    recommendedFormat: 'PDF atau Gambar',
    color: 'from-matcha-700 to-matcha-900',
    badgeBg: 'bg-matcha-100 text-matcha-800 border-matcha-200'
  };

  // Helper to get doc key for target
  const getTargetKey = (target: 'group' | number) => {
    return target === 'group' ? docType : `${docType}_pax_${target}`;
  };

  const activeKey = getTargetKey(selectedTarget);
  const activeStagedDoc = stagedDocs[activeKey];

  // Count modified / total docs staged
  const modifiedCount = (Object.values(stagedDocs) as StagedDoc[]).filter(d => d.isModified).length;
  const totalStagedCount = (Object.values(stagedDocs) as StagedDoc[]).filter(d => d.fileUrl).length;

  const handleFileForTarget = (target: 'group' | number, file: File) => {
    if (file.size > 150 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 150MB.');
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Format file tidak didukung. Harap pilih PDF, JPG, atau PNG.');
      return;
    }

    const key = getTargetKey(target);
    const targetName = target === 'group' ? 'Kolektif Group' : `Pax ${target + 1} (${passengers[target]?.name})`;
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);

    setProcessingFileName(`${file.name} (${sizeInMb} MB)`);
    setFileProcessingProgress(0);

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setFileProcessingProgress(percent);
      }
    };
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setStagedDocs(prev => ({
        ...prev,
        [key]: {
          fileUrl: dataUrl,
          fileName: `${file.name} (${sizeInMb} MB)`,
          isModified: true
        }
      }));
      setFileProcessingProgress(null);
      setProcessingFileName('');
      toast.success(`File ${file.name} (${sizeInMb} MB) berhasil disiapkan untuk ${targetName}. Klik "Simpan Semua" jika sudah selesai.`, {
        duration: 4000
      });
    };
    reader.onerror = () => {
      setFileProcessingProgress(null);
      setProcessingFileName('');
      toast.error('Gagal membaca file. Silakan coba lagi.');
    };
    reader.readAsDataURL(file);
  };

  const handleUrlForTarget = (target: 'group' | number, url: string) => {
    if (!url.trim()) return;
    const key = getTargetKey(target);
    const targetName = target === 'group' ? 'Kolektif Group' : `Pax ${target + 1} (${passengers[target]?.name})`;

    setStagedDocs(prev => ({
      ...prev,
      [key]: {
        fileUrl: url.trim(),
        fileName: 'Direct URL Link',
        isModified: true
      }
    }));
    setUrlInput('');
    toast.info(`URL disiapkan untuk ${targetName}. Klik "Simpan Semua" jika sudah selesai.`);
  };

  const handleClearDocForTarget = (targetKey: string) => {
    setStagedDocs(prev => ({
      ...prev,
      [targetKey]: {
        fileUrl: '',
        fileName: '',
        isModified: true
      }
    }));
    toast.info('Dokumen dilepas dari daftar simpan.');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileForTarget(selectedTarget, e.dataTransfer.files[0]);
    }
  };

  // Submit ALL staged documents in a single batch request
  const handleSubmitAll = async () => {
    const itemsToSubmit: Array<{ docType: string; fileUrl: string }> = [];

    // Check all possible targets
    // 1. Group
    if (stagedDocs[docType]) {
      itemsToSubmit.push({
        docType,
        fileUrl: stagedDocs[docType].fileUrl || ''
      });
    }

    // 2. Each pax
    passengers.forEach((p) => {
      const key = `${docType}_pax_${p.idx}`;
      if (stagedDocs[key]) {
        itemsToSubmit.push({
          docType: key,
          fileUrl: stagedDocs[key].fileUrl || ''
        });
      }
    });

    if (itemsToSubmit.length === 0) {
      toast.error('Belum ada dokumen yang dipilih atau diunggah.');
      return;
    }

    setLoading(true);
    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/final-documents/${registrationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          items: itemsToSubmit
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal menyimpan dokumen batch');
      }

      toast.success(`Berhasil menyimpan seluruh ${config.title}!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Upload batch documents error:", error);
      toast.error(error.message || 'Gagal menyimpan seluruh dokumen');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteTarget = (key: string) => {
    setTargetToDelete(key);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (!targetToDelete) return;
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/final-documents/${registrationId}/${targetToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus dokumen di server');
      }

      handleClearDocForTarget(targetToDelete);
      toast.success(`Dokumen berhasil dihapus dari server.`);
      setShowDeleteConfirm(false);
      setTargetToDelete(null);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus dokumen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]"
        >
          {/* Header Banner */}
          <div className={`p-6 bg-gradient-to-r ${config.color} text-white relative shrink-0`}>
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-2 backdrop-blur-md">
              <FileCheck className="w-3.5 h-3.5" /> Dokumen Final Keberangkatan
            </div>
            <h2 className="text-xl font-bold">{config.title}</h2>
            <p className="text-xs text-white/80 mt-1">
              Pemesan: <span className="font-semibold text-white">{jamaahName}</span> {packageName ? `• ${packageName}` : ''} ({passengers.length} Pax)
            </p>
          </div>

          {/* Mode Switch Bar (if multi pax) */}
          {passengers.length > 1 && (
            <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-medium shrink-0">
              <span className="text-gray-600 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Upload Banyak Sekaligus (Batch Upload)
              </span>
              <div className="flex bg-white p-0.5 rounded-xl border border-gray-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode('batch')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'batch' 
                      ? 'bg-indigo-600 text-white shadow' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Daftar Semua Pax
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('single')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'single' 
                      ? 'bg-indigo-600 text-white shadow' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" /> Fosil Target tunggal
                </button>
              </div>
            </div>
          )}

          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Recommendation info */}
            <div className="p-3.5 bg-blue-50/80 border border-blue-100 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Pro-Tip Batch Upload:</span> Anda dapat memasukkan file PDF/Foto untuk seluruh Pax 1, Pax 2, dan Pax 3 secara bertahap di bawah, lalu klik <span className="font-bold underline text-blue-700">"Simpan Semua Dokumen"</span> satu kali di akhir.
              </div>
            </div>

            {/* VIEW MODE 1: BATCH LIST VIEW (Upload all Pax on 1 screen) */}
            {viewMode === 'batch' && passengers.length > 1 && (
              <div className="space-y-4">
                {/* 1. Kolektif Group Box */}
                <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-600 text-white">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Kolektif Group (1 File untuk Semua Pax)</h4>
                        <p className="text-[10px] text-gray-500">Gunakan jika tiket/visa dibuat dalam 1 dokumen gabungan rombongan</p>
                      </div>
                    </div>

                    {stagedDocs[docType]?.fileUrl ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 
                        {stagedDocs[docType]?.isModified ? 'Baru Siap Simpan' : 'Terunggah'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                        Belum Ada File
                      </span>
                    )}
                  </div>

                  {stagedDocs[docType]?.fileUrl ? (
                    <div className="p-3 bg-white border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="font-bold text-gray-800 truncate">{stagedDocs[docType]?.fileName || 'Dokumen Kolektif'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openDataUrlInNewTab(stagedDocs[docType].fileUrl)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Lihat
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDeleteTarget(docType)}
                          className="p-1 hover:bg-red-50 text-red-600 rounded-lg"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-1">
                      <label className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm transition-all">
                        <Upload className="w-3.5 h-3.5" /> Pilih File Group (PDF)
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileForTarget('group', e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                    Atau Upload Masing-Masing Per Pax ({passengers.length} Jamaah)
                  </span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                {/* 2. Pax Individual Cards */}
                <div className="space-y-2.5">
                  {passengers.map((p) => {
                    const paxKey = `${docType}_pax_${p.idx}`;
                    const pDoc = stagedDocs[paxKey];

                    return (
                      <div 
                        key={p.idx}
                        className={`p-4 rounded-2xl border transition-all ${
                          pDoc?.fileUrl 
                            ? 'bg-emerald-50/40 border-emerald-200 shadow-sm' 
                            : 'bg-gray-50/60 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl text-white font-bold text-xs shrink-0 ${
                              pDoc?.fileUrl ? 'bg-emerald-600' : 'bg-matcha-800'
                            }`}>
                              Pax {p.idx + 1}
                            </div>
                            <div className="truncate">
                              <h5 className="text-xs font-bold text-gray-900 truncate">{p.name}</h5>
                              <p className="text-[10px] text-gray-500">NIK: {p.nik}</p>
                            </div>
                          </div>

                          {/* File status / actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {pDoc?.fileUrl ? (
                              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm">
                                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 truncate max-w-[150px]">
                                  <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">{pDoc.fileName || 'Dokumen Pax'}</span>
                                </span>

                                {pDoc.isModified && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-600 text-white animate-pulse">
                                    BARU
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => openDataUrlInNewTab(pDoc.fileUrl)}
                                  className="p-1 hover:bg-gray-100 text-gray-600 rounded-md"
                                  title="Lihat Document"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => confirmDeleteTarget(paxKey)}
                                  className="p-1 hover:bg-red-50 text-red-600 rounded-md"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <label className="px-3 py-1.5 bg-matcha-900 hover:bg-matcha-950 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm transition-all">
                                  <Upload className="w-3.5 h-3.5" /> Upload File
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleFileForTarget(p.idx, e.target.files[0]);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW MODE 2: SINGLE TARGET SELECTOR VIEW */}
            {(viewMode === 'single' || passengers.length <= 1) && (
              <div className="space-y-4">
                {/* Target Selector */}
                {passengers.length > 1 && (
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-indigo-600" /> Target Dokumen Aktif:
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">Klik target untuk memilih PDF</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {/* Option: Group */}
                      <button
                        type="button"
                        onClick={() => setSelectedTarget('group')}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          selectedTarget === 'group'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Users className="w-4 h-4 shrink-0" />
                          <div>
                            <p className="text-xs font-bold">Kolektif / Group</p>
                            <p className={`text-[10px] ${selectedTarget === 'group' ? 'text-indigo-100' : 'text-gray-500'}`}>1 File Semua Pax</p>
                          </div>
                        </div>
                        {stagedDocs[docType]?.fileUrl ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            stagedDocs[docType]?.isModified 
                              ? 'bg-blue-400 text-white animate-pulse' 
                              : selectedTarget === 'group' ? 'bg-white text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {stagedDocs[docType]?.isModified ? 'BARU' : 'SIAP'}
                          </span>
                        ) : (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${selectedTarget === 'group' ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-100 text-gray-400'}`}>
                            Belum
                          </span>
                        )}
                      </button>

                      {/* Options: Individual Pax */}
                      {passengers.map((p) => {
                        const pKey = `${docType}_pax_${p.idx}`;
                        const isSelected = selectedTarget === p.idx;
                        const hasDoc = !!stagedDocs[pKey]?.fileUrl;
                        const isMod = !!stagedDocs[pKey]?.isModified;

                        return (
                          <button
                            key={p.idx}
                            type="button"
                            onClick={() => setSelectedTarget(p.idx)}
                            className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-matcha-900 text-white border-matcha-900 shadow-md'
                                : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <User className="w-4 h-4 shrink-0" />
                              <div className="truncate">
                                <p className="text-xs font-bold truncate">Pax {p.idx + 1}: {p.name}</p>
                                <p className={`text-[10px] truncate ${isSelected ? 'text-matcha-200' : 'text-gray-500'}`}>Perorangan</p>
                              </div>
                            </div>
                            {hasDoc ? (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                                isMod 
                                  ? 'bg-blue-500 text-white animate-pulse' 
                                  : isSelected ? 'bg-white text-matcha-900' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {isMod ? 'BARU' : 'SIAP'}
                              </span>
                            ) : (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${isSelected ? 'bg-matcha-800 text-matcha-100' : 'bg-gray-100 text-gray-400'}`}>
                                Belum
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* File Uploader box for active selected target */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">
                      Upload File Untuk:{' '}
                      <span className="text-indigo-600 underline">
                        {selectedTarget === 'group'
                          ? 'Kolektif Group (Semua Pax)'
                          : `Pax ${selectedTarget + 1}: ${passengers[selectedTarget as number]?.name}`}
                      </span>
                    </span>

                    {/* Tab switch */}
                    <div className="flex bg-gray-200 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setActiveTab('upload')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all ${
                          activeTab === 'upload' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        <Upload className="w-3 h-3" /> File
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('url')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all ${
                          activeTab === 'url' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" /> Link URL
                      </button>
                    </div>
                  </div>

                  {activeTab === 'upload' ? (
                    <div>
                      {activeStagedDoc?.fileUrl ? (
                        <div className="p-4 border-2 border-emerald-200 bg-emerald-50/50 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-red-100 text-red-600 rounded-xl font-black text-xs flex items-center gap-1.5">
                                <FileText className="w-5 h-5" /> PDF
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-900">
                                  {activeStagedDoc.fileName || `${config.title} File`}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {activeStagedDoc.isModified ? '✨ Baru disiapkan (Belum disimpan)' : 'Tersimpan di server'}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => openDataUrlInNewTab(activeStagedDoc.fileUrl)}
                              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-sm"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Lihat
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-emerald-100 text-xs">
                            <label className="text-indigo-700 font-bold hover:underline cursor-pointer">
                              Ganti File
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg,.webp"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleFileForTarget(selectedTarget, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => confirmDeleteTarget(activeKey)}
                              className="text-red-600 font-bold hover:underline flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Hapus
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-3xl p-7 text-center transition-all cursor-pointer ${
                            isDragging 
                              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' 
                              : 'border-gray-200 hover:border-gray-400 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <label className="cursor-pointer block space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                              <Upload className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">
                                Klik untuk memilih PDF / Foto untuk{' '}
                                <span className="text-indigo-600 underline">
                                  {selectedTarget === 'group'
                                    ? 'Kolektif Group'
                                    : `Pax ${selectedTarget + 1}`}
                                </span>
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1">Maksimal 20 MB (PDF, JPG, PNG)</p>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.png,.jpg,.jpeg,.webp"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileForTarget(selectedTarget, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 bg-white p-3 rounded-xl border border-gray-200">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/eticket.pdf"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUrlForTarget(selectedTarget, urlInput)}
                          className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl"
                        >
                          Set Link
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div className="text-xs font-semibold text-gray-600">
              {totalStagedCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {totalStagedCount} Dokumen Siap
                  {modifiedCount > 0 && <span className="text-blue-700 font-extrabold">({modifiedCount} Perubahan)</span>}
                </span>
              ) : (
                <span className="text-gray-400">Belum ada dokumen yang disiapkan</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitAll}
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl text-xs font-bold bg-matcha-900 hover:bg-matcha-950 text-white shadow-lg shadow-matcha-900/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Semua...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Simpan Semua {config.title}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl border border-gray-100 text-center space-y-5"
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">Konfirmasi Hapus Dokumen</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus <span className="font-bold text-gray-800">{config.title}</span> ini? Dokumen ini akan langsung terhapus dan tidak tampil lagi di Portal Jamaah.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={loading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Ya, Hapus Dokumen
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
