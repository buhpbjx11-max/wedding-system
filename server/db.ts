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
let memoryGuestId = 1;
let memoryRsvpResponseId = 1;
let memoryWeddingId = 1;
let memoryTokenId = 1;
let memoryInvitationId = 1;

const memoryWeddings: Array<any> = [];
const memoryGuests: Array<any> = [];
const memoryRsvpResponses: Array<any> = [];
const memoryRsvpTokens: Array<any> = [];
const memoryInvitations: Array<any> = [];

function getOrCreateMemoryWedding(userId: number) {
  let wedding = memoryWeddings.find(w => w.userId === userId);
  if (!wedding) {
    wedding = {
      id: memoryWeddingId++,
      userId,
      brideNames: null,
      groomNames: null,
      weddingDate: null,
      venue: null,
      guestCount: 0,
      rsvpDeadline: null,
      budget: null,
      theme: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryWeddings.push(wedding);
  }
  return wedding;
}

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
  if (!db) return getOrCreateMemoryWedding(userId);

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
  if (!db) {
    const wedding = getOrCreateMemoryWedding(data.userId);
    Object.assign(wedding, data, { updatedAt: new Date() });
    return wedding;
  }

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
  if (!db) {
    return memoryGuests
      .filter(guest => guest.weddingId === weddingId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

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
  if (!db) {
    const now = new Date();
    const guest = {
      id: memoryGuestId++,
      weddingId: data.weddingId,
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      group: data.group,
      role: data.role || "regular",
      status: "pending",
      mealPreference: data.mealPreference ?? null,
      plusOnes: data.plusOnes || 0,
      notes: data.notes ?? null,
      invitationSentAt: null,
      rsvpedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    memoryGuests.push(guest);
    return guest;
  }

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
    group: "bride" | "groom" | "mutual";
    role: "regular" | "vip" | "bridesmaid" | "groomsman";
    status: "pending" | "confirmed" | "declined";
    mealPreference: "regular" | "vegetarian" | "vegan" | "glutenFree";
    plusOnes: number;
    notes: string;
  }>
) {
  const db = await getDb();
  if (!db) {
    const guest = memoryGuests.find(item => item.id === guestId);
    if (!guest) return [];
    Object.assign(guest, data, { updatedAt: new Date() });
    return [guest];
  }

  return await db.update(guests).set(data as any).where(eq(guests.id, guestId));
}

export async function deleteGuest(guestId: number) {
  const db = await getDb();
  if (!db) {
    const index = memoryGuests.findIndex(item => item.id === guestId);
    if (index === -1) return [];
    const [deleted] = memoryGuests.splice(index, 1);
    return [deleted];
  }

  return await db.delete(guests).where(eq(guests.id, guestId));
}

export async function getGuestById(guestId: number) {
  const db = await getDb();
  if (!db) return memoryGuests.find(guest => guest.id === guestId);

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
  if (!db) {
    return memoryRsvpResponses.filter(response => response.weddingId === weddingId);
  }

  return await db
    .select()
    .from(rsvpResponses)
    .where(eq(rsvpResponses.weddingId, weddingId));
}

export async function getRsvpResponseByGuestId(weddingId: number, guestId: number) {
  const db = await getDb();
  if (!db) {
    return memoryRsvpResponses.find(
      response => response.weddingId === weddingId && response.guestId === guestId
    );
  }

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
  if (!db) {
    const existing = memoryRsvpResponses.find(
      response =>
        response.weddingId === data.weddingId && response.guestId === data.guestId
    );
    const payload = {
      weddingId: data.weddingId,
      guestId: data.guestId,
      attending: data.attending,
      mealPreference: data.mealPreference ?? null,
      plusOnesCount: data.plusOnesCount || 0,
      plusOnesDetails: data.plusOnesDetails ?? [],
      notes: data.notes ?? null,
      updatedAt: new Date(),
    };
    if (existing) {
      Object.assign(existing, payload);
      return existing;
    }

    const created = {
      id: memoryRsvpResponseId++,
      ...payload,
      respondedAt: new Date(),
      createdAt: new Date(),
    };
    memoryRsvpResponses.push(created);
    return created;
  }

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

// Invitation queries
export async function getInvitationsByWeddingId(weddingId: number) {
  const db = await getDb();
  if (!db) {
    return memoryInvitations
      .filter(invitation => invitation.weddingId === weddingId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  return await db
    .select()
    .from(invitations)
    .where(eq(invitations.weddingId, weddingId))
    .orderBy(desc(invitations.createdAt));
}

export async function createInvitation(data: {
  weddingId: number;
  guestId?: number | null;
  title: string;
  content: string;
  imageUrl?: string | null;
  includeRsvpLink?: boolean;
  status?: "draft" | "scheduled" | "sent" | "failed";
}) {
  const db = await getDb();
  if (!db) {
    const row = {
      id: memoryInvitationId++,
      weddingId: data.weddingId,
      guestId: data.guestId ?? null,
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl ?? null,
      includeRsvpLink: data.includeRsvpLink ?? true,
      sentAt: null,
      status: data.status ?? "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryInvitations.push(row);
    return row;
  }

  await db.insert(invitations).values({
    weddingId: data.weddingId,
    guestId: data.guestId ?? null,
    title: data.title,
    content: data.content,
    imageUrl: data.imageUrl ?? null,
    includeRsvpLink: data.includeRsvpLink ?? true,
    status: data.status ?? "draft",
  });

  const created = await db
    .select()
    .from(invitations)
    .where(eq(invitations.weddingId, data.weddingId))
    .orderBy(desc(invitations.createdAt))
    .limit(1);

  return created[0];
}

// RSVP Token queries
export async function createRsvpToken(data: {
  weddingId: number;
  guestId: number;
}) {
  const db = await getDb();
  if (!db) {
    const token = `rsvp-${data.guestId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const row = {
      id: memoryTokenId++,
      weddingId: data.weddingId,
      guestId: data.guestId,
      token,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryRsvpTokens.push(row);
    return { token, expiresAt };
  }

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
  if (!db) return memoryRsvpTokens.find(row => row.token === token);

  const result = await db
    .select()
    .from(rsvpTokens)
    .where(eq(rsvpTokens.token, token))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Wedding update
export async function updateWedding(
  userId: number,
  data: Partial<{
    brideNames: string | null;
    groomNames: string | null;
    weddingDate: Date | null;
    venue: string | null;
    theme: string | null;
  }>
) {
  const db = await getDb();
  if (!db) {
    let wedding = memoryWeddings.find(w => w.userId === userId);
    if (!wedding) wedding = getOrCreateMemoryWedding(userId);
    Object.assign(wedding, data, { updatedAt: new Date() });
    return wedding;
  }
  const existing = await getWeddingByUserId(userId);
  if (!existing) {
    await db.insert(weddings).values({ userId, ...data } as any);
  } else {
    await db.update(weddings).set(data as any).where(eq(weddings.userId, userId));
  }
  return await getWeddingByUserId(userId);
}

// In-memory designs store (no DB table yet)
let memoryDesignId = 1;
const memoryDesigns: Array<{
  id: number;
  weddingId: number;
  title: string;
  type: "text" | "image";
  content: string;
  createdAt: Date;
  updatedAt: Date;
}> = [];

export async function getDesignsByWeddingId(weddingId: number) {
  return [...memoryDesigns.filter(d => d.weddingId === weddingId)].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export async function createDesign(data: {
  weddingId: number;
  title: string;
  type: "text" | "image";
  content: string;
}) {
  const now = new Date();
  const design = { id: memoryDesignId++, ...data, createdAt: now, updatedAt: now };
  memoryDesigns.push(design);
  return design;
}

export async function updateDesign(
  designId: number,
  data: Partial<{ title: string; type: "text" | "image"; content: string }>
) {
  const design = memoryDesigns.find(d => d.id === designId);
  if (!design) return null;
  Object.assign(design, data, { updatedAt: new Date() });
  return design;
}

export async function deleteDesign(designId: number) {
  const index = memoryDesigns.findIndex(d => d.id === designId);
  if (index === -1) return null;
  const [deleted] = memoryDesigns.splice(index, 1);
  return deleted;
}
