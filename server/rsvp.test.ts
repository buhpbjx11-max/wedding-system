import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { nanoid } from "nanoid";

// Mock database functions
const mockDb = {
  getWeddingByUserId: async (userId: number) => ({
    id: 1,
    userId,
    brideNames: "Bride",
    groomNames: "Groom",
    weddingDate: new Date("2026-06-15"),
    venue: "Test Venue",
    budget: "50000",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  createRsvpToken: async (data: any) => data,
  getRsvpTokenByToken: async (token: string) => ({
    id: 1,
    weddingId: 1,
    guestId: 1,
    token,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  }),
  getGuestById: async (guestId: number) => ({
    id: guestId,
    weddingId: 1,
    name: "John Doe",
    email: "john@example.com",
    phone: "555-1234",
    group: "mutual",
    role: "regular",
    mealPreference: "regular",
    plusOnes: 0,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  createOrUpdateRsvpResponse: async (data: any) => ({
    id: 1,
    weddingId: data.weddingId,
    guestId: data.guestId,
    attending: data.attending,
    mealPreference: data.mealPreference,
    plusOnesCount: data.plusOnesCount || 0,
    plusOnesDetails: data.plusOnesDetails,
    notes: data.notes,
    submittedAt: new Date(),
    updatedAt: new Date(),
  }),
};

function createAuthContext(userId: number = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("RSVP System", () => {
  describe("generateToken", () => {
    it("should generate an RSVP token for a guest", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.rsvp.generateToken({
        guestId: 1,
      });

      expect(result).toHaveProperty("token");
      expect(result.token).toBeTruthy();
      expect(result.token).toHaveLength(32);
    });
  });

  describe("getByToken", () => {
    it("should retrieve guest and token data by token", async () => {
      const token = nanoid(32);
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.rsvp.getByToken({ token });

      expect(result).toHaveProperty("guest");
      expect(result).toHaveProperty("rsvpToken");
      expect(result.guest?.name).toBe("John Doe");
      expect(result.rsvpToken?.token).toBe(token);
    });

    it("should throw error for invalid token", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.rsvp.getByToken({ token: "invalid-token" });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("submit", () => {
    it("should submit RSVP with attendance confirmation", async () => {
      const token = nanoid(32);
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.rsvp.submit({
        token,
        attending: true,
        mealPreference: "vegetarian",
        plusOnesCount: 1,
      });

      expect(result).toHaveProperty("id");
      expect(result.attending).toBe(true);
      expect(result.mealPreference).toBe("vegetarian");
      expect(result.plusOnesCount).toBe(1);
    });

    it("should submit RSVP with decline", async () => {
      const token = nanoid(32);
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.rsvp.submit({
        token,
        attending: false,
      });

      expect(result).toHaveProperty("id");
      expect(result.attending).toBe(false);
    });

    it("should handle all meal preferences", async () => {
      const token = nanoid(32);
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const preferences = ["regular", "vegetarian", "vegan", "glutenFree"] as const;

      for (const pref of preferences) {
        const result = await caller.rsvp.submit({
          token,
          attending: true,
          mealPreference: pref,
        });

        expect(result.mealPreference).toBe(pref);
      }
    });

    it("should handle plus ones correctly", async () => {
      const token = nanoid(32);
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.rsvp.submit({
        token,
        attending: true,
        plusOnesCount: 3,
      });

      expect(result.plusOnesCount).toBe(3);
    });
  });

  describe("list", () => {
    it("should list all RSVP responses for a wedding", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.rsvp.list();

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
