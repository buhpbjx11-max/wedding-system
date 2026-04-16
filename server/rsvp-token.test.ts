import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("RSVP Token System", () => {
  describe("getByToken", () => {
    it("returns demo guest data for demo-token-12345", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.rsvp.getByToken({ token: "demo-token-12345" });

      expect(result).toBeDefined();
      expect(result.guest).toBeDefined();
      expect(result.guest.name).toBe("אורח דמו");
      expect(result.guest.email).toBe("demo@example.com");
      expect(result.rsvpToken).toBeDefined();
      expect(result.rsvpToken.token).toBe("demo-token-12345");
    });

    it("throws NOT_FOUND error for invalid token", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.rsvp.getByToken({ token: "invalid-token" });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });

    it("throws NOT_FOUND error for empty token", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.rsvp.getByToken({ token: "" });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });

    it("demo guest has correct structure", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.rsvp.getByToken({ token: "demo-token-12345" });

      // Verify guest structure
      expect(result.guest).toHaveProperty("id");
      expect(result.guest).toHaveProperty("weddingId");
      expect(result.guest).toHaveProperty("name");
      expect(result.guest).toHaveProperty("email");
      expect(result.guest).toHaveProperty("phone");
      expect(result.guest).toHaveProperty("side");
      expect(result.guest).toHaveProperty("status");
      expect(result.guest).toHaveProperty("createdAt");
      expect(result.guest).toHaveProperty("updatedAt");

      // Verify token structure
      expect(result.rsvpToken).toHaveProperty("id");
      expect(result.rsvpToken).toHaveProperty("guestId");
      expect(result.rsvpToken).toHaveProperty("token");
      expect(result.rsvpToken).toHaveProperty("expiresAt");
      expect(result.rsvpToken).toHaveProperty("createdAt");
    });

    it("demo token expiration is in the future", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.rsvp.getByToken({ token: "demo-token-12345" });
      const now = new Date();

      expect(result.rsvpToken.expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });
  });
});
