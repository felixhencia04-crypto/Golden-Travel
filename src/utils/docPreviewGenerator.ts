export const getDocPreviewDataUrl = (
  catId: string | null | undefined,
  jamaahName: string = 'Jamaah',
  packageName: string = 'Paket Umroh / Haji',
  paxIdx: number = 0
): string => {
  const cleanCat = (catId || '').toLowerCase().trim();
  const safeName = (jamaahName || 'Surya Sugiharto').trim();
  const upperName = safeName.toUpperCase();

  let svgContent = '';

  if (cleanCat.includes('ktp') || cleanCat.includes('penduduk')) {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 540" width="856" height="540">
  <defs>
    <linearGradient id="ktpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#bae6fd" />
      <stop offset="50%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
  </defs>
  <rect width="856" height="540" rx="24" fill="url(#ktpGrad)" stroke="#0369a1" stroke-width="4"/>
  <text x="428" y="45" font-family="Segoe UI, sans-serif" font-weight="bold" font-size="20" fill="#032b45" text-anchor="middle">REPUBLIK INDONESIA</text>
  <text x="428" y="70" font-family="Segoe UI, sans-serif" font-weight="bold" font-size="16" fill="#032b45" text-anchor="middle">PROVINSI DKI JAKARTA - KOTA JAKARTA SELATAN</text>
  <text x="50" y="115" font-family="monospace" font-weight="bold" font-size="26" fill="#000">NIK : 3174092810880005</text>
  <g font-family="Segoe UI, sans-serif" font-size="15" font-weight="bold" fill="#051c2c">
    <text x="50" y="155">Nama</text><text x="240" y="155">: ${upperName}</text>
    <text x="50" y="190">Tempat/Tgl Lahir</text><text x="240" y="190">: JAKARTA, 15 OKTOBER 1988</text>
    <text x="50" y="225">Jenis Kelamin</text><text x="240" y="225">: LAKI-LAKI</text><text x="480" y="225">Gol. Darah : O</text>
    <text x="50" y="260">Alamat</text><text x="240" y="260">: JL. KEBAYORAN BARU NO. 45</text>
    <text x="80" y="290">RT/RW</text><text x="240" y="290">: 004 / 007</text>
    <text x="80" y="320">Kel/Desa</text><text x="240" y="320">: KEBAYORAN LAMA</text>
    <text x="80" y="350">Kecamatan</text><text x="240" y="350">: KEBAYORAN LAMA</text>
    <text x="50" y="385">Agama</text><text x="240" y="385">: ISLAM</text>
    <text x="50" y="420">Status Perkawinan</text><text x="240" y="420">: MENIKAH</text>
    <text x="50" y="455">Pekerjaan</text><text x="240" y="455">: KARYAWAN SWASTA</text>
    <text x="50" y="490">Kewarganegaraan</text><text x="240" y="490">: WNI</text>
    <text x="50" y="525">Berlaku Hingga</text><text x="240" y="525">: SEUMUR HIDUP</text>
  </g>
  <rect x="630" y="140" width="180" height="240" rx="12" fill="#b91c1c" stroke="#fff" stroke-width="4"/>
  <circle cx="720" cy="220" r="45" fill="#fecaca"/>
  <path d="M 650 350 C 650 270, 790 270, 790 350 Z" fill="#fecaca"/>
  <text x="720" y="420" font-family="Segoe UI, sans-serif" font-size="12" fill="#000" text-anchor="middle">JAKARTA SELATAN</text>
  <text x="720" y="438" font-family="Segoe UI, sans-serif" font-size="11" fill="#000" text-anchor="middle">12-10-2021</text>
  <path d="M 660 490 Q 720 460 780 495" stroke="#1e3a8a" stroke-width="3" fill="none"/>
</svg>`;
  } else if (cleanCat.includes('paspor') || cleanCat.includes('passport')) {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 540" width="856" height="540">
  <rect width="856" height="540" rx="16" fill="#0f172a" stroke="#d97706" stroke-width="4"/>
  <rect width="856" height="70" fill="#1e293b"/>
  <text x="428" y="32" font-family="Segoe UI, sans-serif" font-weight="bold" font-size="20" fill="#f59e0b" text-anchor="middle">REPUBLIK INDONESIA - REPUBLIC OF INDONESIA</text>
  <text x="428" y="56" font-family="Segoe UI, sans-serif" font-weight="bold" font-size="16" fill="#94a3b8" text-anchor="middle">PASPOR - PASSPORT</text>
  <g font-family="Segoe UI, sans-serif" font-size="14" fill="#e2e8f0">
    <text x="50" y="110" font-size="11" fill="#64748b">Jenis/Type</text><text x="50" y="130" font-weight="bold" fill="#f59e0b">P</text>
    <text x="160" y="110" font-size="11" fill="#64748b">Kode Negara/Country Code</text><text x="160" y="130" font-weight="bold">IDN</text>
    <text x="360" y="110" font-size="11" fill="#64748b">No. Paspor/Passport No.</text><text x="360" y="130" font-weight="bold" fill="#f59e0b">B 9823145</text>
    <text x="50" y="170" font-size="11" fill="#64748b">Nama Lengkap / Full Name</text>
    <text x="50" y="195" font-weight="bold" font-size="22" fill="#ffffff">${upperName}</text>
    <text x="50" y="235" font-size="11" fill="#64748b">Kewarganegaraan / Nationality</text><text x="50" y="255" font-weight="bold">INDONESIA</text>
    <text x="280" y="235" font-size="11" fill="#64748b">Tgl Lahir / Date of Birth</text><text x="280" y="255" font-weight="bold">15 OCT 1988</text>
    <text x="500" y="235" font-size="11" fill="#64748b">Jenis Kelamin / Sex</text><text x="500" y="255" font-weight="bold">L / M</text>
    <text x="50" y="295" font-size="11" fill="#64748b">Tempat Lahir / Place of Birth</text><text x="50" y="315" font-weight="bold">JAKARTA</text>
    <text x="280" y="295" font-size="11" fill="#64748b">Tgl Pengeluaran / Date of Issue</text><text x="280" y="315" font-weight="bold">20 JAN 2024</text>
    <text x="500" y="295" font-size="11" fill="#64748b">Tgl Habis Berlaku / Date of Expiry</text><text x="500" y="315" font-weight="bold" fill="#22c55e">20 JAN 2034</text>
    <text x="50" y="355" font-size="11" fill="#64748b">Kantor Pengeluar / Issuing Authority</text><text x="50" y="375" font-weight="bold">KANIM JAKARTA SELATAN</text>
  </g>
  <rect x="660" y="100" width="150" height="200" rx="12" fill="#334155" stroke="#f59e0b" stroke-width="2"/>
  <circle cx="735" cy="170" r="40" fill="#94a3b8"/>
  <path d="M 675 280 C 675 220, 795 220, 795 280 Z" fill="#94a3b8"/>
  <rect x="0" y="440" width="856" height="100" fill="#020617"/>
  <text x="40" y="475" font-family="monospace" font-size="20" fill="#38bdf8" letter-spacing="4">P&lt;IDN${upperName.replace(/[^A-Z]/g, '')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
  <text x="40" y="515" font-family="monospace" font-size="20" fill="#38bdf8" letter-spacing="4">B9823145&lt;4IDN8810158M3401205&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;06</text>
</svg>`;
  } else if (cleanCat.includes('kk') || cleanCat.includes('keluarga')) {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 540" width="856" height="540">
  <rect width="856" height="540" fill="#ffffff" stroke="#94a3b8" stroke-width="4"/>
  <text x="428" y="45" font-family="Georgia, serif" font-weight="bold" font-size="24" fill="#0f172a" text-anchor="middle">KARTU KELUARGA</text>
  <text x="428" y="70" font-family="Segoe UI, sans-serif" font-weight="bold" font-size="16" fill="#0f172a" text-anchor="middle">No. 3174091210880005</text>
  <g font-family="Segoe UI, sans-serif" font-size="12" fill="#334155">
    <text x="40" y="110" font-weight="bold">Nama Kepala Keluarga : ${upperName}</text>
    <text x="40" y="130">Alamat : JL. KEBAYORAN BARU NO. 45</text>
    <text x="40" y="150">RT/RW : 004 / 007</text>
    <text x="500" y="110">Desa/Kelurahan : KEBAYORAN LAMA</text>
    <text x="500" y="130">Kecamatan : KEBAYORAN LAMA</text>
    <text x="500" y="150">Kabupaten/Kota : JAKARTA SELATAN</text>
  </g>
  <rect x="40" y="170" width="776" height="260" fill="none" stroke="#0f172a" stroke-width="2"/>
  <line x1="40" y1="205" x2="816" y2="205" stroke="#0f172a" stroke-width="2"/>
  <g font-family="Segoe UI, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">
    <text x="55" y="192">No</text>
    <text x="90" y="192">Nama Lengkap</text>
    <text x="320" y="192">NIK</text>
    <text x="500" y="192">Jenis Kelamin</text>
    <text x="630" y="192">Tempat Lahir</text>
  </g>
  <g font-family="Segoe UI, sans-serif" font-size="11" fill="#334155">
    <text x="55" y="235">1</text>
    <text x="90" y="235" font-weight="bold">${safeName}</text>
    <text x="320" y="235">3174092810880005</text>
    <text x="500" y="235">LAKI-LAKI</text>
    <text x="630" y="235">JAKARTA</text>

    <text x="55" y="270">2</text>
    <text x="90" y="270">Siti Aminah (Istri)</text>
    <text x="320" y="270">3174095405900003</text>
    <text x="500" y="270">PEREMPUAN</text>
    <text x="630" y="270">BANDUNG</text>
  </g>
  <text x="650" y="470" font-family="Segoe UI, sans-serif" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">KEPALA DINAS KEPENDUDUKAN</text>
  <text x="650" y="490" font-family="Segoe UI, sans-serif" font-size="11" fill="#475569" text-anchor="middle">DAN PENCATATAN SIPIL</text>
  <circle cx="650" cy="495" r="30" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="4,2"/>
</svg>`;
  } else if (cleanCat.includes('foto') || cleanCat.includes('photo')) {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <rect width="400" height="600" rx="16" fill="#b91c1c" stroke="#dc2626" stroke-width="4"/>
  <circle cx="200" cy="220" r="100" fill="#fed7aa"/>
  <path d="M 120 180 Q 200 80 280 180 Z" fill="#1e293b"/>
  <path d="M 60 520 C 60 360, 340 360, 340 520 Z" fill="#0f172a"/>
  <polygon points="170,400 230,400 200,520" fill="#ffffff"/>
  <polygon points="190,400 210,400 205,480 200,500" fill="#b91c1c"/>
  <rect x="20" y="525" width="360" height="55" rx="12" fill="rgba(15, 23, 42, 0.95)" />
  <text x="200" y="550" font-family="Segoe UI, sans-serif" font-weight="bold" font-size="16" fill="#ffffff" text-anchor="middle">PAS FOTO 4x6 HASIL UNGGAH</text>
  <text x="200" y="568" font-family="Segoe UI, sans-serif" font-size="12" fill="#f59e0b" text-anchor="middle">${safeName}</text>
</svg>`;
  } else if (cleanCat.includes('vaksin') || cleanCat.includes('vaccine')) {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 540" width="856" height="540">
  <defs>
    <linearGradient id="vaxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#022c22" />
      <stop offset="100%" stop-color="#064e3b" />
    </linearGradient>
  </defs>
  <rect width="856" height="540" rx="20" fill="url(#vaxGrad)" stroke="#10b981" stroke-width="4"/>
  <rect x="20" y="20" width="816" height="500" rx="12" fill="none" stroke="#d97706" stroke-width="2"/>
  <text x="428" y="65" font-family="Georgia, serif" font-weight="bold" font-size="22" fill="#f59e0b" text-anchor="middle">SERTIFIKAT VAKSINASI INTERNASIONAL</text>
  <text x="428" y="90" font-family="Segoe UI, sans-serif" font-size="14" fill="#a7f3d0" text-anchor="middle">INTERNATIONAL CERTIFICATE OF VACCINATION (MENINGITIS &amp; COVID-19)</text>
  <g font-family="Segoe UI, sans-serif" font-size="14" fill="#ecfdf5">
    <text x="60" y="145" font-size="12" fill="#6ee7b7">Nama Jamaah / Full Name:</text>
    <text x="60" y="170" font-weight="bold" font-size="22" fill="#ffffff">${upperName}</text>
    <text x="60" y="215" font-size="12" fill="#6ee7b7">No. NIK / Passport:</text>
    <text x="60" y="235" font-weight="bold" font-size="16" fill="#f59e0b">3174092810880005 / B 9823145</text>
  </g>
  <rect x="60" y="270" width="520" height="200" fill="rgba(6, 78, 59, 0.6)" stroke="#10b981" stroke-width="1.5" rx="8"/>
  <line x1="60" y1="310" x2="580" y2="310" stroke="#10b981" stroke-width="1.5"/>
  <g font-family="Segoe UI, sans-serif" font-size="12" font-weight="bold" fill="#f59e0b">
    <text x="80" y="295">Jenis Vaksin</text>
    <text x="260" y="295">Tanggal Vaksin</text>
    <text x="430" y="295">Status / Validitas</text>
  </g>
  <g font-family="Segoe UI, sans-serif" font-size="12" fill="#ffffff">
    <text x="80" y="345">Meningitis Meningokokus</text>
    <text x="260" y="345">10 AGUSTUS 2025</text>
    <text x="430" y="345" font-weight="bold" fill="#34d399">LENGKAP (VALID)</text>

    <text x="80" y="395">COVID-19 Booster 2</text>
    <text x="260" y="395">15 JANUARI 2025</text>
    <text x="430" y="395" font-weight="bold" fill="#34d399">LENGKAP (VALID)</text>
  </g>
  <rect x="620" y="270" width="180" height="180" fill="#ffffff" rx="12"/>
  <path d="M 640 290 h 40 v 40 h -40 z M 740 290 h 40 v 40 h -40 z M 640 390 h 40 v 40 h -40 z M 700 330 h 30 v 30 h -30 z" fill="#064e3b"/>
  <text x="710" y="475" font-family="Segoe UI, sans-serif" font-size="11" font-weight="bold" fill="#6ee7b7" text-anchor="middle">KEMENKES RI VERIFIED</text>
</svg>`;
  } else if (cleanCat.includes('nikah')) {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 540" width="856" height="540">
  <rect width="856" height="540" rx="20" fill="#14532d" stroke="#d97706" stroke-width="4"/>
  <rect x="20" y="20" width="816" height="500" rx="12" fill="none" stroke="#f59e0b" stroke-width="2"/>
  <text x="428" y="65" font-family="Georgia, serif" font-weight="bold" font-size="22" fill="#f59e0b" text-anchor="middle">KEMENTERIAN AGAMA REPUBLIK INDONESIA</text>
  <text x="428" y="90" font-family="Georgia, serif" font-weight="bold" font-size="18" fill="#ffffff" text-anchor="middle">KUTIPAN AKTA NIKAH / BUKU NIKAH</text>
  <text x="428" y="115" font-family="Segoe UI, sans-serif" font-size="12" fill="#fef08a" text-anchor="middle">No. Akta: 0421/04/VIII/2021</text>
  <rect x="50" y="140" width="360" height="340" fill="rgba(20, 83, 45, 0.7)" stroke="#f59e0b" stroke-width="1" rx="12"/>
  <text x="230" y="170" font-family="Segoe UI, sans-serif" font-weight="bold" font-size="16" fill="#f59e0b" text-anchor="middle">SUAMI</text>
  <g font-family="Segoe UI, sans-serif" font-size="12" fill="#ffffff">
    <text x="70" y="210">Nama : ${safeName}</text>
    <text x="70" y="240">NIK : 3174092810880005</text>
    <text x="70" y="270">Tgl Lahir : 15 Oktober 1988</text>
    <text x="70" y="300">Warganegara : Indonesia</text>
  </g>
  <rect x="446" y="140" width="360" height="340" fill="rgba(20, 83, 45, 0.7)" stroke="#f59e0b" stroke-width="1" rx="12"/>
  <text x="626" y="170" font-family="Segoe UI, sans-serif" font-weight="bold" font-size="16" fill="#f59e0b" text-anchor="middle">ISTRI</text>
  <g font-family="Segoe UI, sans-serif" font-size="12" fill="#ffffff">
    <text x="466" y="210">Nama : Siti Aminah</text>
    <text x="466" y="240">NIK : 3174095405900003</text>
    <text x="466" y="270">Tgl Lahir : 04 Mei 1990</text>
    <text x="466" y="300">Warganegara : Indonesia</text>
  </g>
  <text x="428" y="500" font-family="Georgia, serif" font-style="italic" font-size="12" fill="#fef08a" text-anchor="middle">KUA Kecamatan Kebayoran Baru, Jakarta Selatan</text>
</svg>`;

  } else {
    // Default document template
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 540" width="856" height="540">
  <rect width="856" height="540" rx="20" fill="#1e293b" stroke="#3b82f6" stroke-width="4"/>
  <text x="428" y="100" font-family="Segoe UI, sans-serif" font-weight="bold" font-size="24" fill="#60a5fa" text-anchor="middle">DOKUMEN PERSYARATAN TERVERIFIKASI</text>
  <text x="428" y="140" font-family="Segoe UI, sans-serif" font-size="18" fill="#ffffff" text-anchor="middle">${(catId || 'Dokumen').toUpperCase()}</text>
  <text x="428" y="240" font-family="Segoe UI, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">Nama Jamaah: ${safeName}</text>
  <text x="428" y="280" font-family="Segoe UI, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Paket: ${packageName}</text>
  <rect x="228" y="340" width="400" height="120" rx="12" fill="rgba(59, 130, 246, 0.2)" stroke="#60a5fa" stroke-width="2"/>
  <text x="428" y="390" font-family="Segoe UI, sans-serif" font-weight="bold" font-size="16" fill="#38bdf8" text-anchor="middle">BERKAS DALAM DOKUMEN MANIFEST</text>
  <text x="428" y="420" font-family="Segoe UI, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">Sistem Informasi Pendaftaran Haramain Travel</text>
</svg>`;
  }

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
};
