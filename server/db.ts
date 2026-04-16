import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  weddings,
  guests,
  invitations,
  rsvpResponses,
  seatingTables,
  seats,
  budgetItems,
  gifts,
  timelineEvents,
  albums,
  galleryImages,
  emailLogs,
  rsvpTokens,
  galleryUploadTokens,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Wedding queries
export async function getWeddingByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(weddings)
    .where(eq(weddings.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createWedding(data: {
  userId: number;
  brideNames?: string;
  groomNames?: string;
  weddingDate?: Date;
  venue?: string;
  budget?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(weddings).values({
    userId: data.userId,
    brideNames: data.brideNames,
    groomNames: data.groomNames,
    weddingDate: data.weddingDate,
    venue: data.venue,
    budget: data.budget as any,
  });

  return result;
}

// Guest queries
export async function getGuestsByWeddingId(weddingId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(guests)
    .where(eq(guests.weddingId, weddingId))
    .orderBy(guests.createdAt);
}

export async function createGuest(data: {
  weddingId: number;
  name: string;
  email?: string;
  phone?: string;
  group: "bride" | "groom" | "mutual";
  role?: "regular" | "vip" | "bridesmaid" | "groomsman";
  mealPreference?: "regular" | "vegetarian" | "vegan" | "glutenFree";
  plusOnes?: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(guests).values({
    weddingId: data.weddingId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    group: data.group,
    role: data.role || "regular",
    mealPreference: data.mealPreference,
    plusOnes: data.plusOnes || 0,
    notes: data.notes,
  });

  // Fetch and return the created guest
  const createdGuests = await db
    .select()
    .from(guests)
    .where(eq(guests.weddingId, data.weddingId))
    .orderBy(desc(guests.createdAt))
    .limit(1);

  return createdGuests[0];
}

export async function updateGuest(
  guestId: number,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    role: "regular" | "vip" | "bridesmaid" | "groomsman";
    status: "pending" | "confirmed" | "declined";
    mealPreference: "regular" | "vegetarian" | "vegan" | "glutenFree";
    plusOnes: number;
    notes: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(guests).set(data as any).where(eq(guests.id, guestId));
}

export async function deleteGuest(guestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(guests).where(eq(guests.id, guestId));
}

export async function getGuestById(guestId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(guests)
    .where(eq(guests.id, guestId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// RSVP queries
export async function getRsvpResponsesByWeddingId(weddingId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(rsvpResponses)
    .where(eq(rsvpResponses.weddingId, weddingId));
}

export async function getRsvpResponseByGuestId(weddingId: number, guestId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(rsvpResponses)
    .where(and(eq(rsvpResponses.weddingId, weddingId), eq(rsvpResponses.guestId, guestId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateRsvpResponse(data: {
  weddingId: number;
  guestId: number;
  attending: boolean;
  mealPreference?: string;
  plusOnesCount?: number;
  plusOnesDetails?: any;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getRsvpResponseByGuestId(data.weddingId, data.guestId);

  if (existing) {
    return await db
      .update(rsvpResponses)
      .set({
        attending: data.attending,
        mealPreference: data.mealPreference as any,
        plusOnesCount: data.plusOnesCount || 0,
        plusOnesDetails: data.plusOnesDetails,
        notes: data.notes,
      })
      .where(eq(rsvpResponses.id, existing.id));
  } else {
    return await db.insert(rsvpResponses).values({
      weddingId: data.weddingId,
      guestId: data.guestId,
      attending: data.attending,
      mealPreference: data.mealPreference as any,
      plusOnesCount: data.plusOnesCount || 0,
      plusOnesDetails: data.plusOnesDetails,
      notes: data.notes,
    });
  }
}

// Budget queries
export async function getBudgetItemsByWeddingId(weddingId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(budgetItems)
    .where(eq(budgetItems.weddingId, weddingId));
}

export async function createBudgetItem(data: {
  weddingId: number;
  category: string;
  description?: string;
  budgeted?: string;
  spent?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(budgetItems).values({
    weddingId: data.weddingId,
    category: data.category,
    description: data.description,
    budgeted: data.budgeted as any,
    spent: data.spent as any,
    notes: data.notes,
  });
}

// Gallery queries
export async function getAlbumsByWeddingId(weddingId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(albums)
    .where(eq(albums.weddingId, weddingId));
}

export async function getGalleryImagesByAlbumId(albumId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(galleryImages)
    .where(eq(galleryImages.albumId, albumId))
    .orderBy(desc(galleryImages.createdAt));
}

export async function createGalleryImage(data: {
  albumId: number;
  weddingId: number;
  guestId?: number;
  title?: string;
  description?: string;
  imageUrl: string;
  fileSize?: number;
  uploadedBy?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(galleryImages).values({
    albumId: data.albumId,
    weddingId: data.weddingId,
    guestId: data.guestId,
    title: data.title,
    description: data.description,
    imageUrl: data.imageUrl,
    fileSize: data.fileSize,
    uploadedBy: data.uploadedBy,
  });
}

// Timeline queries
export async function getTimelineEventsByWeddingId(weddingId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(timelineEvents)
    .where(eq(timelineEvents.weddingId, weddingId))
    .orderBy(timelineEvents.orderIndex);
}

export async function createTimelineEvent(data: {
  weddingId: number;
  title: string;
  time?: Date;
  category?: string;
  description?: string;
  assignedTo?: string;
  orderIndex?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(timelineEvents).values({
    weddingId: data.weddingId,
    title: data.title,
    time: data.time,
    category: data.category as any,
    description: data.description,
    assignedTo: data.assignedTo,
    orderIndex: data.orderIndex || 0,
  });
}

// Email log queries
export async function createEmailLog(data: {
  weddingId: number;
  recipientEmail: string;
  type: "rsvp_confirmation" | "rsvp_reminder" | "invitation" | "other";
  subject?: string;
  status?: "sent" | "failed" | "pending";
  error?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(emailLogs).values({
    weddingId: data.weddingId,
    recipientEmail: data.recipientEmail,
    type: data.type,
    subject: data.subject,
    status: data.status || "pending",
    error: data.error,
  });
}

// RSVP Token queries
export async function createRsvpToken(data: {
  weddingId: number;
  guestId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate unique token
  const token = `rsvp-${data.guestId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  // Set expiration to 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await db.insert(rsvpTokens).values({
    weddingId: data.weddingId,
    guestId: data.guestId,
    token: token,
    expiresAt: expiresAt,
  });

  // Return the created token
  return { token, expiresAt };
}

export async function getRsvpTokenByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(rsvpTokens)
    .where(eq(rsvpTokens.token, token))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}
