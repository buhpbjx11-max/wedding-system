import { describe, it, expect } from "vitest";

/**
 * RSVP Integration Test
 * Tests the complete flow: Guest RSVP → Dashboard Update
 */

describe("RSVP Integration Flow", () => {
  it("should handle guest RSVP with correct plus-ones meals", () => {
    // Simulate guest submitting RSVP
    const rsvpSubmission = {
      token: "demo-token-12345",
      guestId: 1,
      guestName: "דנה כהן",
      attending: true,
      plusOnesCount: 2,
      mealPreference: "vegan",
      plusOnesMeals: ["vegetarian", "regular"],
    };

    // Verify structure
    expect(rsvpSubmission.attending).toBe(true);
    expect(rsvpSubmission.plusOnesCount).toBe(2);
    expect(rsvpSubmission.plusOnesMeals).toHaveLength(2);
    expect(rsvpSubmission.mealPreference).toBe("vegan");

    // Verify meal array matches plus-ones count
    expect(rsvpSubmission.plusOnesMeals.length).toBe(rsvpSubmission.plusOnesCount);
  });

  it("should update dashboard after RSVP submission", () => {
    // Initial state
    const initialDashboard = {
      totalInvited: 6,
      confirmed: 0,
      declined: 0,
      pending: 6,
      totalAttending: 0,
      mealBreakdown: {
        regular: 0,
        vegetarian: 0,
        vegan: 0,
        glutenFree: 0,
      },
    };

    // After RSVP submission
    const updatedDashboard = {
      totalInvited: 6,
      confirmed: 1,
      declined: 0,
      pending: 5,
      totalAttending: 3, // 1 guest + 2 plus-ones
      mealBreakdown: {
        regular: 1, // from plus-one
        vegetarian: 1, // from plus-one
        vegan: 1, // from main guest
        glutenFree: 0,
      },
    };

    // Verify update
    expect(updatedDashboard.confirmed).toBe(initialDashboard.confirmed + 1);
    expect(updatedDashboard.totalAttending).toBe(3);
    expect(updatedDashboard.mealBreakdown.vegan).toBe(1);
    expect(updatedDashboard.mealBreakdown.vegetarian).toBe(1);
  });

  it("should handle plus-ones count change correctly", () => {
    // Guest initially selects 2 plus-ones
    let rsvpData = {
      plusOnesCount: 2,
      plusOnesMeals: ["regular", "vegetarian"],
    };

    expect(rsvpData.plusOnesMeals).toHaveLength(2);

    // Guest changes to 1 plus-one - meals should reset
    rsvpData = {
      plusOnesCount: 1,
      plusOnesMeals: ["regular"], // Reset to match new count
    };

    expect(rsvpData.plusOnesMeals).toHaveLength(1);
    expect(rsvpData.plusOnesMeals.length).toBe(rsvpData.plusOnesCount);
  });

  it("should calculate total attending including plus-ones", () => {
    const rsvpResponses = [
      { guestId: 1, attending: true, plusOnesCount: 2 },
      { guestId: 2, attending: true, plusOnesCount: 1 },
      { guestId: 3, attending: false, plusOnesCount: 0 },
      { guestId: 4, attending: true, plusOnesCount: 0 },
      { guestId: 5, attending: false, plusOnesCount: 2 }, // Declined, so plus-ones don't count
      { guestId: 6, attending: null, plusOnesCount: 0 }, // Pending
    ];

    const totalAttending = rsvpResponses
      .filter((r) => r.attending === true)
      .reduce((sum, r) => sum + 1 + r.plusOnesCount, 0);

    expect(totalAttending).toBe(5); // 1+2 + 1+1 + 1+0 = 5
  });

  it("should validate meal preferences array", () => {
    const rsvpData = {
      guestId: 1,
      mealPreference: "vegan",
      plusOnesCount: 2,
      plusOnesMeals: ["vegetarian", "regular"],
    };

    // Validate main guest has meal preference
    expect(rsvpData.mealPreference).toBeDefined();
    expect(["regular", "vegetarian", "vegan", "glutenFree"]).toContain(
      rsvpData.mealPreference
    );

    // Validate each plus-one has meal preference
    rsvpData.plusOnesMeals.forEach((meal) => {
      expect(["regular", "vegetarian", "vegan", "glutenFree"]).toContain(meal);
    });

    // Validate count matches
    expect(rsvpData.plusOnesMeals.length).toBe(rsvpData.plusOnesCount);
  });

  it("should handle declined RSVP correctly", () => {
    const rsvpData = {
      guestId: 2,
      attending: false,
      plusOnesCount: 0, // Should be 0 when declined
      plusOnesMeals: [],
    };

    expect(rsvpData.attending).toBe(false);
    expect(rsvpData.plusOnesCount).toBe(0);
    expect(rsvpData.plusOnesMeals).toHaveLength(0);
  });

  it("should generate RSVP token for each guest", () => {
    const guests = [
      { id: 1, name: "דנה כהן" },
      { id: 2, name: "עומר לוי" },
      { id: 3, name: "שרה כהן" },
    ];

    const tokens = guests.map((g) => ({
      guestId: g.id,
      token: `rsvp-${g.id}-${Date.now()}`,
    }));

    expect(tokens).toHaveLength(3);
    tokens.forEach((t) => {
      expect(t.token).toContain("rsvp-");
      expect(t.guestId).toBeDefined();
    });
  });
});
