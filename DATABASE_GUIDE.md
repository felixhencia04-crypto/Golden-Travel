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

## 3. Perbaikan Ownership & Migrasi (Best Practices)

Jika Anda menemui error `must be owner of table` atau `relation does not exist` saat melakukan sinkronisasi otomatis, ikuti langkah-langkah berikut:

### A. Perbaikan Ownership (SQL)
Jalankan query berikut di konsol database (PostgreSQL) untuk memberikan hak kepemilikan tabel kepada user aplikasi Anda (`ai_studio_app_user`):

```sql
-- Mengubah owner tabel utama
ALTER TABLE packages OWNER TO ai_studio_app_user;
ALTER TABLE users OWNER TO ai_studio_app_user;
ALTER TABLE registrations OWNER TO ai_studio_app_user;
ALTER TABLE payments OWNER TO ai_studio_app_user;
ALTER TABLE documents OWNER TO ai_studio_app_user;

-- Jika tabel baru (CMS) sudah dibuat oleh user lain
ALTER TABLE package_itineraries OWNER TO ai_studio_app_user;
ALTER TABLE gallery_photos OWNER TO ai_studio_app_user;
ALTER TABLE gallery_videos OWNER TO ai_studio_app_user;
ALTER TABLE memories OWNER TO ai_studio_app_user;

-- Opsional: Mengubah owner semua tabel di schema public secara massal
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' OWNER TO ai_studio_app_user';
    END LOOP;
END $$;
```

### B. Sinkronisasi Skema dengan Drizzle CLI
Alih-alih mengandalkan script `auto-sync` saat runtime (yang sering gagal karena masalah permission), gunakan perintah CLI berikut dari terminal:

1. **Push Skema Langsung (Cepat & Direkomendasikan untuk Dev):**
   ```bash
   npm run db:push
   ```
   *Perintah ini akan memaksa skema di database sesuai dengan yang ada di `src/db/schema.ts`.*

2. **Generate Migrasi (Untuk Production):**
   ```bash
   npx drizzle-kit generate --config=src/db/drizzle.config.ts
   ```

### C. Evaluasi & Best Practice Pengelolaan Database
1. **Pemisahan Proses (CI/CD):** Jangan jalankan `ALTER TABLE` atau migrasi skema di dalam kode aplikasi utama (`server.ts`) saat startup di lingkungan production. Gunakan proses terpisah (seperti `init container` atau step migrasi di pipeline CI/CD).
2. **User Least Privilege:** User aplikasi (`app_user`) idealnya hanya memiliki hak DML (`SELECT`, `INSERT`, `UPDATE`, `DELETE`). Gunakan user terpisah (`migration_user`) yang memiliki hak DDL (`ALTER`, `CREATE`) dan merupakan Owner dari tabel untuk menjalankan migrasi.
3. **Audit Log:** Selalu simpan history migrasi di folder `drizzle/` agar perubahan skema dapat di-track dan di-rollback jika terjadi kegagalan.
