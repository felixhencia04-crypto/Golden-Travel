# Panduan Database Sistem Umroh

Berikut adalah skema database (PostgreSQL/MySQL) dan contoh query SQL untuk sistem pendaftaran umroh.

## 1. Skema Database

### Tabel `users`
Menyimpan data Admin dan Jamaah.
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'jamaah')),
    firebase_uid TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabel `packages`
Menyimpan daftar paket perjalanan umroh.
```sql
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    duration TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabel `registrations`
Melacak status pendaftaran jamaah.
```sql
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    package_id UUID REFERENCES packages(id),
    status TEXT NOT NULL CHECK (status IN (
        'package_selected', 
        'bio_filled', 
        'dp1_paid', 
        'dp2_paid', 
        'documents_uploaded', 
        'fully_paid', 
        'visa_ticket_ready'
    )),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabel `payments`
Menyimpan bukti transfer dan status pembayaran.
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES registrations(id),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('dp1', 'dp2', 'full')),
    amount DECIMAL(12, 2) NOT NULL,
    proof_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabel `documents`
Menyimpan file dokumen jamaah (KTP, KK, Paspor).
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES registrations(id),
    doc_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 2. Contoh Query SQL

### Mendapatkan daftar pendaftaran beserta nama jamaah dan paketnya
```sql
SELECT 
    r.id AS registration_id,
    u.name AS jamaah_name,
    p.name AS package_name,
    r.status
FROM registrations r
JOIN users u ON r.user_id = u.id
JOIN packages p ON r.package_id = p.id;
```

### Melihat total pembayaran yang sudah disetujui untuk satu pendaftaran
```sql
SELECT 
    registration_id, 
    SUM(amount) AS total_paid
FROM payments
WHERE registration_id = 'YOUR_REGISTRATION_ID' AND status = 'approved'
GROUP BY registration_id;
```

### Update status pendaftaran menjadi 'DP 1 Paid' setelah admin menyetujui pembayaran
```sql
UPDATE registrations 
SET status = 'dp1_paid', updated_at = NOW() 
WHERE id = 'YOUR_REGISTRATION_ID';
```
