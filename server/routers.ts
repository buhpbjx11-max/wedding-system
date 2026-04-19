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
        if (input.token === "demo-token-12345") {
          return {
            guest: { id: 1, name: "דנה כהן", phone: "0501234567", group: "bride", role: "regular", weddingId: 1 },
            event: { brideNames: "יעל ודן", groomNames: null, weddingDate: null, venue: "אולם השרון", theme: null },
          };
        }

        const rsvpToken = await db.getRsvpTokenByToken(input.token);
        if (!rsvpToken) throw new TRPCError({ code: "NOT_FOUND" });

        const guest = await db.getGuestById(rsvpToken.guestId);
        if (!guest) throw new TRPCError({ code: "NOT_FOUND" });

        const wedding = await db.getWeddingByUserId(rsvpToken.weddingId);
        const event = wedding
          ? { brideNames: wedding.brideNames, groomNames: wedding.groomNames, weddingDate: wedding.weddingDate, venue: wedding.venue, theme: wedding.theme }
          : null;

        return { guest, event };
      }),

    submit: publicProcedure
      .input(
        z.object({
          token: z.string(),
          attending: z.boolean(),
          plusOnesCount: z.number().default(0),
          mealPreference: z.enum(["regular", "vegetarian", "vegan", "glutenFree"]).optional(),
          plusOnesMeals: z.array(z.enum(["regular", "vegetarian", "vegan", "glutenFree"])).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        if (input.token === "demo-token-12345") {
          return { success: true };
        }

        const rsvpToken = await db.getRsvpTokenByToken(input.token);
        if (!rsvpToken) throw new TRPCError({ code: "NOT_FOUND" });

        // Save RSVP response
        await db.createOrUpdateRsvpResponse({
          weddingId: rsvpToken.weddingId,
          guestId: rsvpToken.guestId,
          attending: input.attending,
          mealPreference: input.mealPreference,
          plusOnesCount: input.plusOnesCount,
          plusOnesDetails: input.plusOnesMeals || [],
          notes: input.notes,
        });

        // Update guest status and plusOnes to reflect RSVP
        await db.updateGuest(rsvpToken.guestId, {
          status: input.attending ? "confirmed" : "declined",
          plusOnes: input.attending ? input.plusOnesCount : 0,
          mealPreference: input.mealPreference as any,
        });

        return { success: true };
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

  whatsapp: router({
    prepareList: protectedProcedure
      .input(z.object({ guestIds: z.array(z.number()).optional() }))
      .mutation(async ({ ctx, input }) => {
        const wedding = await db.getWeddingByUserId(ctx.user.id);
        if (!wedding) throw new TRPCError({ code: "NOT_FOUND" });

        const allGuests = await db.getGuestsByWeddingId(wedding.id);
        const targets = input.guestIds?.length
          ? allGuests.filter(g => input.guestIds!.includes(g.id))
          : allGuests;

        const result = await Promise.all(
          targets.map(async guest => {
            let token = (await db.getRsvpTokenByGuestId(guest.id))?.token;
            if (!token) {
              const created = await db.createRsvpToken({ weddingId: wedding.id, guestId: guest.id });
              token = created.token;
            }
            return { guestId: guest.id, name: guest.name, phone: guest.phone ?? null, token };
          })
        );
        return result;
      }),
  }),

  wedding: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return (await db.getWeddingByUserId(ctx.user.id)) ?? null;
    }),
    update: protectedProcedure
      .input(
        z.object({
          brideNames: z.string().optional(),
          groomNames: z.string().optional(),
          weddingDate: z.string().optional(),
          venue: z.string().optional(),
          theme: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await db.updateWedding(ctx.user.id, {
          brideNames: input.brideNames ?? null,
          groomNames: input.groomNames ?? null,
          weddingDate: input.weddingDate ? new Date(input.weddingDate) : null,
          venue: input.venue ?? null,
          theme: input.theme ?? null,
        });
      }),
  }),

  designs: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const wedding = await db.getWeddingByUserId(ctx.user.id);
      if (!wedding) return [];
      return await db.getDesignsByWeddingId(wedding.id);
    }),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          type: z.enum(["text", "image"]),
          content: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const wedding = await db.getWeddingByUserId(ctx.user.id);
        if (!wedding) throw new TRPCError({ code: "NOT_FOUND" });
        return await db.createDesign({ weddingId: wedding.id, ...input });
      }),
    update: protectedProcedure
      .input(
        z.object({
          designId: z.number(),
          title: z.string().optional(),
          type: z.enum(["text", "image"]).optional(),
          content: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.updateDesign(input.designId, {
          title: input.title,
          type: input.type,
          content: input.content,
        });
      }),
    delete: protectedProcedure
      .input(z.object({ designId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteDesign(input.designId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
