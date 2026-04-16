import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  datetime,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * The owner/couple is the authenticated user managing the wedding.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Wedding table - stores wedding metadata and settings
 * Each user (couple) has one wedding
 */
export const weddings = mysqlTable("weddings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  brideNames: text("brideNames"), // Comma-separated or JSON
  groomNames: text("groomNames"),
  weddingDate: datetime("weddingDate"),
  venue: text("venue"),
  guestCount: int("guestCount").default(0),
  rsvpDeadline: datetime("rsvpDeadline"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  theme: text("theme"), // For storing design preferences
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wedding = typeof weddings.$inferSelect;
export type InsertWedding = typeof weddings.$inferInsert;

/**
 * Guests table - stores guest information
 */
export const guests = mysqlTable("guests", {
  id: int("id").autoincrement().primaryKey(),
  weddingId: int("weddingId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  group: mysqlEnum("group", ["bride", "groom", "mutual"]).notNull(),
  role: mysqlEnum("role", ["regular", "vip", "bridesmaid", "groomsman"]).default("regular"),
  status: mysqlEnum("status", ["pending", "confirmed", "declined"]).default("pending"),
  mealPreference: mysqlEnum("mealPreference", ["regular", "vegetarian", "vegan", "glutenFree"]),
  plusOnes: int("plusOnes").default(0),
  notes: text("notes"),
  invitationSentAt: timestamp("invitationSentAt"),
  rsvpedAt: timestamp("rsvpedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Guest = typeof guests.$inferSelect;
export type InsertGuest = typeof guests.$inferInsert;

/**
 * Invitations table - tracks invitation templates and send status
 */
export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  weddingId: int("weddingId").notNull(),
  guestId: int("guestId"),
  title: varchar("title", { length: 255 }),
  content: text("content"),
  imageUrl: text("imageUrl"),
  includeRsvpLink: boolean("includeRsvpLink").default(true),
  sentAt: timestamp("sentAt"),
  status: mysqlEnum("status", ["draft", "scheduled", "sent", "failed"]).default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

/**
 * RSVP responses table - stores guest responses
 */
export const rsvpResponses = mysqlTable("rsvpResponses", {
  id: int("id").autoincrement().primaryKey(),
  weddingId: int("weddingId").notNull(),
  guestId: int("guestId").notNull(),
  attending: boolean("attending"),
  mealPreference: mysqlEnum("mealPreference", ["regular", "vegetarian", "vegan", "glutenFree"]),
  plusOnesCount: int("plusOnesCount").default(0),
  plusOnesDetails: json("plusOnesDetails"), // Array of {name, mealPreference}
  notes: text("notes"),
  respondedAt: timestamp("respondedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RsvpResponse = typeof rsvpResponses.$inferSelect;
export type InsertRsvpResponse = typeof rsvpResponses.$inferInsert;

/**
 * Tables for seating arrangement
 */
export const seatingTables = mysqlTable("seatingTables", {
  id: int("id").autoincrement().primaryKey(),
  weddingId: int("weddingId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  shape: mysqlEnum("shape", ["round", "square", "rectangle"]).default("round"),
  capacity: int("capacity").default(8),
  color: varchar("color", { length: 7 }), // Hex color
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SeatingTable = typeof seatingTables.$inferSelect;
export type InsertSeatingTable = typeof seatingTables.$inferInsert;

/**
 * Seats within tables
 */
export const seats = mysqlTable("seats", {
  id: int("id").autoincrement().primaryKey(),
  tableId: int("tableId").notNull(),
  guestId: int("guestId"),
  seatNumber: int("seatNumber").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Seat = typeof seats.$inferSelect;
export type InsertSeat = typeof seats.$inferInsert;

/**
 * Budget items
 */
export const budgetItems = mysqlTable("budgetItems", {
  id: int("id").autoincrement().primaryKey(),
  weddingId: int("weddingId").notNull(),
  category: varchar("category", { length: 255 }).notNull(), // e.g., Venue, Catering, Flowers
  description: varchar("description", { length: 255 }),
  budgeted: decimal("budgeted", { precision: 10, scale: 2 }).default("0"),
  spent: decimal("spent", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BudgetItem = typeof budgetItems.$inferSelect;
export type InsertBudgetItem = typeof budgetItems.$inferInsert;

/**
 * Gifts and money tracking
 */
export const gifts = mysqlTable("gifts", {
  id: int("id").autoincrement().primaryKey(),
  weddingId: int("weddingId").notNull(),
  guestId: int("guestId").notNull(),
  type: mysqlEnum("type", ["money", "gift"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).default("0"),
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Gift = typeof gifts.$inferSelect;
export type InsertGift = typeof gifts.$inferInsert;

/**
 * Timeline events
 */
export const timelineEvents = mysqlTable("timelineEvents", {
  id: int("id").autoincrement().primaryKey(),
  weddingId: int("weddingId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  time: datetime("time"),
  category: mysqlEnum("category", ["bride", "groom", "friends", "general"]).default("general"),
  description: text("description"),
  assignedTo: varchar("assignedTo", { length: 255 }), // Name of vendor or person
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = typeof timelineEvents.$inferInsert;

/**
 * Gallery albums
 */
export const albums = mysqlTable("albums", {
  id: int("id").autoincrement().primaryKey(),
  weddingId: int("weddingId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["ceremony", "reception", "dancing", "inspiration", "guest_uploads"]).default("inspiration"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Album = typeof albums.$inferSelect;
export type InsertAlbum = typeof albums.$inferInsert;

/**
 * Gallery images
 */
export const galleryImages = mysqlTable("galleryImages", {
  id: int("id").autoincrement().primaryKey(),
  albumId: int("albumId").notNull(),
  weddingId: int("weddingId").notNull(),
  guestId: int("guestId"), // NULL if uploaded by couple
  title: varchar("title", { length: 255 }),
  description: text("description"),
  imageUrl: text("imageUrl").notNull(),
  fileSize: int("fileSize"),
  uploadedBy: varchar("uploadedBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GalleryImage = typeof galleryImages.$inferSelect;
export type InsertGalleryImage = typeof galleryImages.$inferInsert;

/**
 * Email notification logs
 */
export const emailLogs = mysqlTable("emailLogs", {
  id: int("id").autoincrement().primaryKey(),
  weddingId: int("weddingId").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  type: mysqlEnum("type", ["rsvp_confirmation", "rsvp_reminder", "invitation", "other"]).notNull(),
  subject: varchar("subject", { length: 255 }),
  status: mysqlEnum("status", ["sent", "failed", "pending"]).default("pending"),
  sentAt: timestamp("sentAt"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

/**
 * Public RSVP tokens for guest access without login
 */
export const rsvpTokens = mysqlTable("rsvpTokens", {
  id: int("id").autoincrement().primaryKey(),
  weddingId: int("weddingId").notNull(),
  guestId: int("guestId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: datetime("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RsvpToken = typeof rsvpTokens.$inferSelect;
export type InsertRsvpToken = typeof rsvpTokens.$inferInsert;

/**
 * Public gallery upload tokens for guest access without login
 */
export const galleryUploadTokens = mysqlTable("galleryUploadTokens", {
  id: int("id").autoincrement().primaryKey(),
  weddingId: int("weddingId").notNull(),
  albumId: int("albumId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: datetime("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GalleryUploadToken = typeof galleryUploadTokens.$inferSelect;
export type InsertGalleryUploadToken = typeof galleryUploadTokens.$inferInsert;
