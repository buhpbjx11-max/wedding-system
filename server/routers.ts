import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { nanoid } from "nanoid";
import { systemRouter } from "./_core/systemRouter";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  guests: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const wedding = await db.getWeddingByUserId(ctx.user.id);
      if (!wedding) return [];
      return await db.getGuestsByWeddingId(wedding.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          phone: z.string().optional(),
          group: z.enum(["bride", "groom", "mutual"]),
          role: z.enum(["regular", "vip", "bridesmaid", "groomsman"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const wedding = await db.getWeddingByUserId(ctx.user.id);
        if (!wedding) throw new TRPCError({ code: "NOT_FOUND" });

        return await db.createGuest({
          weddingId: wedding.id,
          name: input.name,
          phone: input.phone,
          group: input.group,
          role: input.role || "regular",
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          guestId: z.number(),
          name: z.string().optional(),
          phone: z.string().optional(),
          group: z.enum(["bride", "groom", "mutual"]).optional(),
          role: z.enum(["regular", "vip", "bridesmaid", "groomsman"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const wedding = await db.getWeddingByUserId(ctx.user.id);
        if (!wedding) throw new TRPCError({ code: "NOT_FOUND" });

        return await db.updateGuest(input.guestId, {
          name: input.name,
          phone: input.phone,
          role: input.role,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ guestId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const wedding = await db.getWeddingByUserId(ctx.user.id);
        if (!wedding) throw new TRPCError({ code: "NOT_FOUND" });

        return await db.deleteGuest(input.guestId);
      }),
  }),

  invitations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const wedding = await db.getWeddingByUserId(ctx.user.id);
      if (!wedding) return [];
      return await db.getInvitationsByWeddingId(wedding.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          content: z.string().min(1),
          imageUrls: z.array(z.string().url()).default([]),
          audience: z.enum(["all", "bride", "groom", "shared"]),
          selectedGuestIds: z.array(z.number()).default([]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const wedding = await db.getWeddingByUserId(ctx.user.id);
        if (!wedding) throw new TRPCError({ code: "NOT_FOUND" });

        const allGuests = await db.getGuestsByWeddingId(wedding.id);

        const baseGuestsByAudience = allGuests.filter(guest => {
          if (input.audience === "all") return true;
          if (input.audience === "shared") return guest.group === "mutual";
          return guest.group === input.audience;
        });

        const finalGuests =
          input.selectedGuestIds.length > 0
            ? baseGuestsByAudience.filter(guest =>
                input.selectedGuestIds.includes(guest.id)
              )
            : baseGuestsByAudience;

        if (finalGuests.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No guests selected for invitation",
          });
        }

        const created = await Promise.all(
          finalGuests.map(guest =>
            db.createInvitation({
              weddingId: wedding.id,
              guestId: guest.id,
              title: input.title,
              content: input.content,
              imageUrl: input.imageUrls[0] ?? null,
              includeRsvpLink: true,
              status: "draft",
            })
          )
        );

        return {
          success: true,
          createdCount: created.length,
        };
      }),
  }),

  rsvp: router({
    generateToken: protectedProcedure
      .input(z.object({ guestId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const wedding = await db.getWeddingByUserId(ctx.user.id);
        if (!wedding) throw new TRPCError({ code: "NOT_FOUND" });

        const { token, expiresAt } = await db.createRsvpToken({
          weddingId: wedding.id,
          guestId: input.guestId,
        });

        return { token, expiresAt };
      }),

    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        // Demo token for testing
        if (input.token === "demo-token-12345") {
          return {
            id: 1,
            name: "דנה כהן",
            phone: "0501234567",
            group: "bride",
            role: "regular",
            weddingId: 1,
          };
        }

        const rsvpToken = await db.getRsvpTokenByToken(input.token);
        if (!rsvpToken) throw new TRPCError({ code: "NOT_FOUND" });

        const guest = await db.getGuestById(rsvpToken.guestId);
        if (!guest) throw new TRPCError({ code: "NOT_FOUND" });

        return guest;
      }),

    submit: publicProcedure
      .input(
        z.object({
          token: z.string(),
          attending: z.boolean(),
          plusOnesCount: z.number().default(0),
          mealPreference: z.enum(["regular", "vegetarian", "vegan", "glutenFree"]).optional(),
          plusOnesMeals: z.array(z.enum(["regular", "vegetarian", "vegan", "glutenFree"])).optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Demo token for testing
        if (input.token === "demo-token-12345") {
          return { success: true };
        }

        const rsvpToken = await db.getRsvpTokenByToken(input.token);
        if (!rsvpToken) throw new TRPCError({ code: "NOT_FOUND" });

        return await db.createOrUpdateRsvpResponse({
          weddingId: rsvpToken.weddingId,
          guestId: rsvpToken.guestId,
          attending: input.attending,
          mealPreference: input.mealPreference,
          plusOnesCount: input.plusOnesCount,
          plusOnesDetails: input.plusOnesMeals || [],
        });
      }),

    summary: protectedProcedure.query(async ({ ctx }) => {
      const wedding = await db.getWeddingByUserId(ctx.user.id);
      if (!wedding) return null;

      const responses = await db.getRsvpResponsesByWeddingId(wedding.id);
      const guests = await db.getGuestsByWeddingId(wedding.id);

      const confirmed = responses.filter((r) => r.attending === true).length;
      const declined = responses.filter((r) => r.attending === false).length;
      const pending = guests.length - responses.length;

      const totalAttending = responses
        .filter((r) => r.attending === true)
        .reduce((sum, r) => sum + 1 + (r.plusOnesCount || 0), 0);

      const meals = {
        regular: 0,
        vegetarian: 0,
        vegan: 0,
        glutenFree: 0,
      };

      responses.forEach((r) => {
        if (
          r.mealPreference &&
          r.attending &&
          r.mealPreference in meals
        ) {
          meals[r.mealPreference as keyof typeof meals]++;
        }
        if (r.plusOnesDetails && r.attending) {
          (r.plusOnesDetails as string[]).forEach((meal: string) => {
            if (meal in meals) {
              meals[meal as keyof typeof meals]++;
            }
          });
        }
      });

      return {
        totalInvited: guests.length,
        confirmed,
        declined,
        pending,
        totalAttending,
        meals,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
