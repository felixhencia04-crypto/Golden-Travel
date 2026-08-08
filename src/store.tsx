import React, { createContext, useContext, useState, useEffect } from 'react';
import { Package, Consultation, Schedule, Announcement, InventoryStatus, HelpTicket, TripMemory } from './types';
import { umrohPackages, hajjPackages } from './data/homeData';

const safeGetItem = (key: string) => {
  try {
    return safeGetItem(key);
  } catch (e) {
    return null;
  }
};
const safeSetItem = (key: string, value: string) => {
  try {
    safeSetItem(key, value);
  } catch (e) {}
};


interface AppState {
  packages: Package[];
  updatePackage: (pkg: Package) => void;
  addPackage: (pkg: Package) => void;
  deletePackage: (id: string) => void;
  schedules: Schedule[];
  addSchedule: (sch: Schedule) => void;
  updateSchedule: (sch: Schedule) => void;
  deleteSchedule: (id: string) => void;
  announcements: Announcement[];
  addAnnouncement: (ann: Announcement) => void;
  deleteAnnouncement: (id: string) => void;
  inventory: InventoryStatus[];
  updateInventory: (status: InventoryStatus) => void;
  consultations: Consultation[];
  addConsultation: (cons: Consultation) => void;
  updateConsultationStatus: (id: string, status: Consultation['status']) => void;
  updateConsultation: (cons: Consultation) => void;
  deleteConsultation: (id: string) => void;
  helpTickets: HelpTicket[];
  addHelpTicket: (ticket: HelpTicket) => void;
  updateHelpTicket: (ticket: HelpTicket) => void;
  memories: TripMemory[];
  addMemory: (memory: TripMemory) => void;
  deleteMemory: (id: string) => void;
  resetAllData: () => void;
}

const defaultPackages: Package[] = [
  ...umrohPackages.map(p => ({ ...p, type: 'umroh' as const, isAvailable: true })),
  ...hajjPackages.map(p => ({ ...p, type: 'haji' as const, isAvailable: true }))
];

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [packages, setPackages] = useState<Package[]>(() => {
    const saved = safeGetItem('golden_travel_packages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultPackages;
      }
    }
    return defaultPackages;
  });

  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const saved = safeGetItem('golden_travel_schedules');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    // Default mock schedules
    return [
      {
        id: 'sch-1',
        packageId: 'umroh-reg-1', // Assuming this ID exists in umrohPackages
        departureDate: '2025-10-15',
        itineraryPdfUrl: 'https://ais-assets.s3.amazonaws.com/itinerary_umroh_reg.pdf',
        availableSeats: 32,
        totalSeats: 45
      },
      {
        id: 'sch-2',
        packageId: 'umroh-plus-1',
        departureDate: '2025-11-20',
        itineraryPdfUrl: 'https://ais-assets.s3.amazonaws.com/itinerary_umroh_plus.pdf',
        availableSeats: 12,
        totalSeats: 45
      }
    ];
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = safeGetItem('golden_travel_announcements');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: '1',
        title: 'Jadwal Manasik Gelombang 1',
        content: 'Diberitahukan kepada seluruh jamaah Umroh keberangkatan Oktober bahwa manasik akan dilaksanakan pada tanggal 1 Oktober di Hotel Harmoni.',
        date: new Date().toISOString(),
        type: 'important'
      }
    ];
  });

  const [inventory, setInventory] = useState<InventoryStatus[]>(() => {
    const saved = safeGetItem('golden_travel_inventory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [helpTickets, setHelpTickets] = useState<HelpTicket[]>(() => {
    const saved = safeGetItem('golden_travel_help_tickets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'ticket-1',
        jamaahId: 'mock-123',
        jamaahName: 'Jamaah Demo',
        subject: 'Pertanyaan Dokumen Paspor',
        message: 'Halo, apakah paspor saya sudah bisa dikirim?',
        status: 'open',
        createdAt: new Date().toISOString(),
        replies: []
      }
    ];
  });

  const [memories, setMemories] = useState<TripMemory[]>(() => {
    const saved = safeGetItem('golden_travel_memories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: '1',
        title: 'Manasik Umroh Akbar',
        description: 'Kebersamaan jamaah saat pembekalan di Batam sebelum keberangkatan.',
        imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80',
        type: 'photo',
        date: '2025-09-01'
      },
      {
        id: '2',
        title: 'Tiba di Madinah',
        description: 'Suasana haru jamaah saat pertama kali menginjakkan kaki di Masjid Nabawi.',
        imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80',
        type: 'photo',
        date: '2025-10-16'
      }
    ];
  });

  const [consultations, setConsultations] = useState<Consultation[]>(() => {
    const saved = safeGetItem('golden_travel_consultations');
    let initialConsultations: Consultation[] = [];
    if (saved) {
      try {
        initialConsultations = JSON.parse(saved);
      } catch (e) {
        initialConsultations = [];
      }
    }
    
    // If no data exists, provide a default mock so dashboard isn't empty
    if (initialConsultations.length === 0) {
      initialConsultations = [
        {
          id: 'mock-123',
          name: 'Jamaah Demo',
          phone: '08123456789',
          packageName: 'Umroh Reguler Bintang 4',
          message: 'Mohon info lebih lanjut terkait keberangkatan akhir tahun.',
          date: new Date().toISOString(),
          status: 'payment'
        }
      ];
    }
    
    return initialConsultations;
  });

  useEffect(() => {
    safeSetItem('golden_travel_packages', JSON.stringify(packages));
  }, [packages]);

  useEffect(() => {
    safeSetItem('golden_travel_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    safeSetItem('golden_travel_consultations', JSON.stringify(consultations));
  }, [consultations]);

  useEffect(() => {
    safeSetItem('golden_travel_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    safeSetItem('golden_travel_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    safeSetItem('golden_travel_help_tickets', JSON.stringify(helpTickets));
  }, [helpTickets]);

  useEffect(() => {
    safeSetItem('golden_travel_memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'golden_travel_consultations' && e.newValue) {
        setConsultations(JSON.parse(e.newValue));
      }
      if (e.key === 'golden_travel_packages' && e.newValue) {
        setPackages(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updatePackage = (updatedPkg: Package) => {
    setPackages(pkgs => pkgs.map(p => p.id === updatedPkg.id ? updatedPkg : p));
  };

  const addPackage = (newPkg: Package) => {
    setPackages(pkgs => [...pkgs, newPkg]);
  };

  const deletePackage = (id: string) => {
    setPackages(pkgs => pkgs.filter(p => p.id !== id));
  };

  const addSchedule = (newSch: Schedule) => {
    setSchedules(prev => [...prev, newSch]);
  };

  const updateSchedule = (updatedSch: Schedule) => {
    setSchedules(prev => prev.map(s => s.id === updatedSch.id ? updatedSch : s));
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const addAnnouncement = (ann: Announcement) => {
    setAnnouncements(prev => [ann, ...prev]);
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const updateInventory = (status: InventoryStatus) => {
    setInventory(prev => {
      const existingIdx = prev.findIndex(i => i.jamaahId === status.jamaahId);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = status;
        return next;
      }
      return [...prev, status];
    });
  };

  const addConsultation = (cons: Consultation) => {
    setConsultations(prev => [cons, ...prev]);
  };

  const updateConsultationStatus = (id: string, status: Consultation['status']) => {
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const updateConsultation = (updatedCons: Consultation) => {
    setConsultations(prev => prev.map(c => c.id === updatedCons.id ? updatedCons : c));
  };

  const deleteConsultation = (id: string) => {
    setConsultations(prev => prev.filter(c => c.id !== id));
  };

  const addHelpTicket = (ticket: HelpTicket) => {
    setHelpTickets(prev => [ticket, ...prev]);
  };

  const updateHelpTicket = (updatedTicket: HelpTicket) => {
    setHelpTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
  };

  const addMemory = (memory: TripMemory) => {
    setMemories(prev => [memory, ...prev]);
  };

  const deleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const resetAllData = () => {
    localStorage.removeItem('golden_travel_consultations');
    localStorage.removeItem('golden_travel_packages');
    window.location.href = '/';
  };

  return (
    <AppContext.Provider value={{ 
      packages, updatePackage, addPackage, deletePackage,
      schedules, addSchedule, updateSchedule, deleteSchedule,
      announcements, addAnnouncement, deleteAnnouncement,
      inventory, updateInventory,
      consultations, addConsultation, updateConsultationStatus, updateConsultation, deleteConsultation,
      helpTickets, addHelpTicket, updateHelpTicket,
      memories, addMemory, deleteMemory,
      resetAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
