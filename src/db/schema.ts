import { pgTable, text, timestamp, uuid, decimal, pgEnum, jsonb, boolean, integer, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['admin', 'super_admin', 'mitra', 'jamaah', 'keuangan', 'operasional', 'marketing']);

export const registrationStatusEnum = pgEnum('registration_status', [
  'DRAFT',
  'PILIH_PAKET',
  'ISI_BIODATA',
  'UPLOAD_DOKUMEN',
  'VERIFIKASI_DOKUMEN',
  'CICIL_BAYAR',
  'VERIFIKASI_BAYAR',
  'LUNAS',
  'SIAP_BERANGKAT',
  'BERANGKAT',
  'SELESAI',
  'CANCELLED'
]);

export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'VERIFIED', 'REJECTED']);
export const paymentTypeEnum = pgEnum('payment_type', ['DP1', 'DP2', 'PELUNASAN']);

export const documentTypeEnum = pgEnum('document_type', ['KTP', 'Paspor', 'Foto', 'Buku Nikah', 'Vaksin', 'Tiket Pesawat', 'Itinerary Final', 'E-Visa', 'Lainnya']);
export const documentStatusEnum = pgEnum('document_status', ['PENDING', 'VERIFIED', 'REJECTED']);

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(), // for URL routing like agency-a.app.com
  domain: text('domain').unique(), // custom domain
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  users: many(users),
  packages: many(packages),
  registrations: many(registrations),
}));

export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  uid: text('uid').unique(), // Firebase Auth UID
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  role: text('role').default('jamaah').notNull(),
  status: text('status').default('active').notNull(),
  mitraId: uuid('mitra_id'), // The Mitra who referred this user
  referralCode: text('referral_code').unique(), // For users with role 'mitra'
  password: text('password'), // Password for direct email/password login
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete column
}, (table) => {
  return {
    deletedAtIndex: index('users_deleted_at_idx').on(table.deletedAt),
    workspaceIdIndex: index('users_workspace_id_idx').on(table.workspaceId),
    uidIndex: index('users_uid_idx').on(table.uid),
    emailIndex: index('users_email_idx').on(table.email),
  };
});

export const usersRelations = relations(users, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [users.workspaceId], references: [workspaces.id] }),
  registrations: many(registrations),
  notifications: many(notifications),
  mitra: one(users, { fields: [users.mitraId], references: [users.id], relationName: 'referrals' }),
  referrals: many(users, { relationName: 'referrals' }),
}));

export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  departureDate: timestamp('departure_date'),
  duration: text('duration').notNull(),
  imageUrl: text('image_url'),
  facilities: text('facilities'),
  excludes: text('excludes'), // Added for CMS
  hotel: text('hotel'), // Added for CMS
  type: text('type').default('umroh').notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  quota: integer('quota').default(45).notNull(),
  manasikPdfUrl: text('manasik_pdf_url'),
  muthawwifName: text('muthawwif_name'),
  muthawwifRole: text('muthawwif_role'),
  muthawwifPhone: text('muthawwif_phone'),
  muthawwifAvatarUrl: text('muthawwif_avatar_url'),
  muthawwifNotes: text('muthawwif_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const packagesRelations = relations(packages, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [packages.workspaceId], references: [workspaces.id] }),
  registrations: many(registrations),
  schedules: many(schedules),
  manifests: many(manifests),
}));

export const registrations = pgTable('registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  userId: uuid('user_id').references(() => users.id).notNull(),
  packageId: uuid('package_id').references(() => packages.id).notNull(),
  scheduleId: uuid('schedule_id').references(() => schedules.id), // Link to a specific schedule
  status: registrationStatusEnum('status').default('DRAFT').notNull(),
  ordererName: text('orderer_name'),
  ordererPhone: text('orderer_phone'),
  ordererEmail: text('orderer_email'),
  ordererNotes: text('orderer_notes'),
  adultCount: text('adult_count').default('1').notNull(),
  childCount: text('child_count').default('0').notNull(),
  infantCount: text('infant_count').default('0').notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  paxData: jsonb('pax_data').$type<any[]>(), // Array of jamaah details
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    userIdIndex: index('registrations_user_id_idx').on(table.userId),
    workspaceIdIndex: index('registrations_workspace_id_idx').on(table.workspaceId),
    statusIndex: index('registrations_status_idx').on(table.status),
  };
});

export const registrationsRelations = relations(registrations, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [registrations.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [registrations.userId], references: [users.id] }),
  package: one(packages, { fields: [registrations.packageId], references: [packages.id] }),
  schedule: one(schedules, { fields: [registrations.scheduleId], references: [schedules.id] }),
  payments: many(payments),
  documents: many(documents),
  certificates: many(certificates),
  activities: many(activities),
  manifests: many(manifests),
}));

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  registrationId: uuid('registration_id').references(() => registrations.id).notNull(),
  paymentType: paymentTypeEnum('payment_type').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  proofUrl: text('proof_url').notNull(),
  status: paymentStatusEnum('status').default('PENDING').notNull(),
  adminNotes: text('admin_notes'),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  workspace: one(workspaces, { fields: [payments.workspaceId], references: [workspaces.id] }),
  registration: one(registrations, { fields: [payments.registrationId], references: [registrations.id] }),
}));

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  registrationId: uuid('registration_id').references(() => registrations.id).notNull(),
  docType: text('doc_type').notNull(),
  fileUrl: text('file_url').notNull(),
  status: documentStatusEnum('status').default('PENDING').notNull(),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    registrationDocTypeIndex: uniqueIndex('registration_doc_type_idx').on(table.registrationId, table.docType),
  };
});

export const documentsRelations = relations(documents, ({ one }) => ({
  workspace: one(workspaces, { fields: [documents.workspaceId], references: [workspaces.id] }),
  registration: one(registrations, { fields: [documents.registrationId], references: [registrations.id] }),
}));

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  userId: uuid('user_id').references(() => users.id), // Nullable for system-wide notifications
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // info, warning, success, error
  isRead: text('is_read').default('false').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  workspace: one(workspaces, { fields: [notifications.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

// --- FASE 1: TAMBAHAN TABEL BARU ---

// 1. schedules (Departure Schedules & Itinerary)
export const schedules = pgTable('schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  packageId: uuid('package_id').references(() => packages.id).notNull(),
  departureDate: timestamp('departure_date').notNull(),
  name: text('name'),
  airline: text('airline'),
  totalSeats: integer('total_seats').notNull(),
  availableSeats: integer('available_seats').notNull(),
  itineraryPdfUrl: text('itinerary_pdf_url'),
  muthawwifName: text('muthawwif_name'),
  muthawwifRole: text('muthawwif_role'),
  muthawwifPhone: text('muthawwif_phone'),
  muthawwifAvatarUrl: text('muthawwif_avatar_url'),
  muthawwifNotes: text('muthawwif_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [schedules.workspaceId], references: [workspaces.id] }),
  package: one(packages, { fields: [schedules.packageId], references: [packages.id] }),
  registrations: many(registrations),
  package_itineraries: many(package_itineraries),
}));

export const package_itineraries = pgTable('package_itineraries', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').references(() => packages.id, { onDelete: 'cascade' }).notNull(),
  day: integer('day').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  location: text('location'),
  meals: text('meals'), // e.g. "B, L, D"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const packageItinerariesRelations = relations(package_itineraries, ({ one }) => ({
  package: one(packages, { fields: [package_itineraries.packageId], references: [packages.id] }),
}));

// Gallery Photos for CMS
export const gallery_photos = pgTable('gallery_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  title: text('title'),
  description: text('description'),
  imageUrl: text('image_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Gallery Videos for CMS (Direct Upload)
export const gallery_videos = pgTable('gallery_videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  title: text('title'),
  description: text('description'),
  videoUrl: text('video_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. buku_kas_mutasi (Financial Ledger)
export const financial_ledger = pgTable('buku_kas_mutasi', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  paymentId: uuid('payment_id').references(() => payments.id), // Link to payment
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  transactionType: text('transaction_type').notNull(), // 'in' or 'out'
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const manifests = pgTable('manifest_keberangkatan', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  packageId: uuid('package_id').references(() => packages.id).notNull(),
  registrationId: uuid('registration_id').references(() => registrations.id).notNull(),
  busNumber: text('bus_number'),
  hotelRoom: text('hotel_room'),
  airplaneSeat: text('airplane_seat'),
  paxManifest: jsonb('pax_manifest').$type<any[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const manifestsRelations = relations(manifests, ({ one }) => ({
  workspace: one(workspaces, { fields: [manifests.workspaceId], references: [workspaces.id] }),
  package: one(packages, { fields: [manifests.packageId], references: [packages.id] }),
  registration: one(registrations, { fields: [manifests.registrationId], references: [registrations.id] }),
}));

// 8. helpdesk_tiket
export const helpdesk_tickets = pgTable('helpdesk_tiket', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  userId: uuid('user_id').references(() => users.id).notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  replies: jsonb('replies').$type<any[]>().default([]).notNull(),
  status: text('status').default('open').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 8. sertifikat_kenangan
export const certificates = pgTable('sertifikat_kenangan', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  registrationId: uuid('registration_id').references(() => registrations.id),
  recipientName: text('recipient_name'),
  certificateUrl: text('certificate_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const certificatesRelations = relations(certificates, ({ one }) => ({
  registration: one(registrations, { fields: [certificates.registrationId], references: [registrations.id] }),
}));
// 9. perlengkapan_status
export const equipment = pgTable('equipment_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  registrationId: uuid('registration_id').references(() => registrations.id).notNull(),
  koper: boolean('koper').default(false).notNull(),
  ihram: boolean('ihram').default(false).notNull(),
  mukena: boolean('mukena').default(false).notNull(),
  assignee: text('assignee'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 10. memories (Gallery)
export const memories = pgTable('memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  packageId: uuid('package_id').references(() => packages.id), // Memories per package
  scheduleId: uuid('schedule_id').references(() => schedules.id), // Memories per specific schedule
  registrationId: uuid('registration_id').references(() => registrations.id), // Targeted memory for specific jamaah registration
  imageUrl: text('image_url').notNull(),
  caption: text('caption'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const memoriesRelations = relations(memories, ({ one }) => ({
  workspace: one(workspaces, { fields: [memories.workspaceId], references: [workspaces.id] }),
  package: one(packages, { fields: [memories.packageId], references: [packages.id] }),
  schedule: one(schedules, { fields: [memories.scheduleId], references: [schedules.id] }),
  registration: one(registrations, { fields: [memories.registrationId], references: [registrations.id] }),
}));

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  registrationId: uuid('registration_id').references(() => registrations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }), // Who performed the action (e.g. admin name or id)
  action: text('action').notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  workspace: one(workspaces, { fields: [activities.workspaceId], references: [workspaces.id] }),
  registration: one(registrations, { fields: [activities.registrationId], references: [registrations.id] }),
  user: one(users, { fields: [activities.userId], references: [users.id] }),
}));

// 11. mitra_users (Authentication)
export const mitraAccountStatusEnum = pgEnum('mitra_account_status', ['incomplete_profile', 'pending_verification', 'active', 'rejected']);

export const mitraUsers = pgTable('mitra_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  noWa: text('no_wa').notNull(),
  passwordHash: text('password_hash').notNull(),
  statusAkun: mitraAccountStatusEnum('status_akun').default('incomplete_profile').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 12. mitra_profiles (KYC Details)
export const mitraProfiles = pgTable('mitra_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => mitraUsers.id, { onDelete: 'cascade' }).notNull().unique(),
  namaLengkap: text('nama_lengkap'),
  nik: text('nik').unique(),
  tempatLahir: text('tempat_lahir'),
  tanggalLahir: text('tanggal_lahir'), 
  alamatLengkap: text('alamat_lengkap'),
  namaBank: text('nama_bank'),
  noRekening: text('no_rekening'),
  namaPemilikRekening: text('nama_pemilik_rekening'),
  npwp: text('npwp'),
  jenisKelamin: text('jenis_kelamin'),
  statusPerkawinan: text('status_perkawinan'),
  pekerjaan: text('pekerjaan'),
  provinsi: text('provinsi'),
  kota: text('kota'),
  kecamatan: text('kecamatan'),
  kodePos: text('kode_pos'),
  whatsapp: text('whatsapp'),
  buktiTransfer: text('bukti_transfer'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 13. kyc_documents (File References)
export const kycDocumentStatusEnum = pgEnum('kyc_document_status', ['pending', 'verified', 'rejected']);
export const kycDocumentTypeEnum = pgEnum('kyc_document_type', ['foto_ktp', 'selfie_ktp', 'npwp', 'buku_tabungan', 'bukti_transfer']);

export const kycDocuments = pgTable('kyc_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => mitraUsers.id, { onDelete: 'cascade' }).notNull(),
  documentType: kycDocumentTypeEnum('document_type').notNull(),
  fileUrl: text('file_url').notNull(),
  status: kycDocumentStatusEnum('status').default('pending').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

export const mitraUsersRelations = relations(mitraUsers, ({ one, many }) => ({
  profile: one(mitraProfiles, { fields: [mitraUsers.id], references: [mitraProfiles.userId] }),
  documents: many(kycDocuments),
}));

export const mitraProfilesRelations = relations(mitraProfiles, ({ one }) => ({
  user: one(mitraUsers, { fields: [mitraProfiles.userId], references: [mitraUsers.id] }),
}));

export const kycDocumentsRelations = relations(kycDocuments, ({ one }) => ({
  user: one(mitraUsers, { fields: [kycDocuments.userId], references: [mitraUsers.id] }),
}));

// 14. mitra_commission_payouts
export const payoutStatusEnum = pgEnum('payout_status', ['PENDING', 'APPROVED', 'REJECTED']);

export const mitraCommissionPayouts = pgTable('mitra_commission_payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  mitraUserId: uuid('mitra_user_id'),
  mitraName: text('mitra_name').notNull(),
  mitraPhone: text('mitra_phone'),
  jamaahName: text('jamaah_name'),
  packageName: text('package_name'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  bankName: text('bank_name').notNull(),
  accountNumber: text('account_number').notNull(),
  accountHolder: text('account_holder').notNull(),
  status: payoutStatusEnum('status').default('PENDING').notNull(),
  mitraNotes: text('mitra_notes'),
  adminNotes: text('admin_notes'),
  proofOfTransferUrl: text('proof_of_transfer_url'),
  transferDate: timestamp('transfer_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 15. hotels
export const hotels = pgTable('hotels', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  name: text('name').notNull(),
  city: text('city').notNull(), // 'Makkah' or 'Madinah'
  rating: integer('rating').default(4).notNull(),
  distance: text('distance'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 16. airlines
export const airlines = pgTable('airlines', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  name: text('name').notNull(),
  code: text('code'),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 17. financial_verifications
export const financialVerifications = pgTable('financial_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  paymentId: uuid('payment_id').references(() => payments.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  verifierName: text('verifier_name'),
  verificationStatus: text('verification_status').default('APPROVED').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 18. admin_settings
export const adminSettings = pgTable('admin_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  travelName: text('travel_name').default('PT Golden Travel Umrah').notNull(),
  travelLogoUrl: text('travel_logo_url'),
  defaultCommissionRate: decimal('default_commission_rate', { precision: 12, scale: 2 }).default('1500000.00'),
  whatsappNumber: text('whatsapp_number').default('08111111111'),
  bankAccounts: jsonb('bank_accounts').$type<any[]>().default([]),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

