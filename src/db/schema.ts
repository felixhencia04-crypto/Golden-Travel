import { pgTable, text, timestamp, uuid, decimal, pgEnum, jsonb, boolean, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['admin', 'mitra', 'jamaah']);

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
  'SELESAI'
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

export const userStatusEnum = pgEnum('user_status', [
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
  'SELESAI'
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').default('jamaah').notNull(),
  status: userStatusEnum('status').default('DRAFT').notNull(),
  mitraId: uuid('mitra_id'), // The Mitra who referred this user
  referralCode: text('referral_code').unique(), // For users with role 'mitra'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete column
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
  type: text('type').default('umroh').notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  quota: integer('quota').default(45).notNull(),
  manasikPdfUrl: text('manasik_pdf_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const packagesRelations = relations(packages, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [packages.workspaceId], references: [workspaces.id] }),
  registrations: many(registrations),
  schedules: many(schedules),
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
  docType: documentTypeEnum('doc_type').notNull(),
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [schedules.workspaceId], references: [workspaces.id] }),
  package: one(packages, { fields: [schedules.packageId], references: [packages.id] }),
  registrations: many(registrations),
}));

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

// 7. manifest_keberangkatan
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
  registrationId: uuid('registration_id').references(() => registrations.id).notNull(),
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
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  registrationId: uuid('registration_id').references(() => registrations.id).notNull(),
  userId: uuid('user_id').references(() => users.id), // Who performed the action (e.g. admin name or id)
  action: text('action').notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  workspace: one(workspaces, { fields: [activities.workspaceId], references: [workspaces.id] }),
  registration: one(registrations, { fields: [activities.registrationId], references: [registrations.id] }),
  user: one(users, { fields: [activities.userId], references: [users.id] }),
}));
