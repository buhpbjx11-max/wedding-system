import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function seedWeddingData() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🌱 Starting wedding data seed...");

    // Create a demo wedding for userId 1
    const weddingResult = await connection.execute(
      `INSERT INTO weddings (userId, brideNames, groomNames, weddingDate, venue, guestCount, rsvpDeadline, budget, theme, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        1, // userId
        "דנה", // bride name
        "עומר", // groom name
        new Date("2026-06-15"), // wedding date
        "מלון הילטון תל אביב", // venue
        50, // guest count estimate
        new Date("2026-05-15"), // RSVP deadline
        50000, // budget
        "מינימליסטי מודרני", // theme
      ]
    );

    const weddingId = weddingResult[0].insertId;
    console.log(`✅ Wedding created with ID: ${weddingId}`);

    // Create demo guests
    const guestData = [
      { name: "אלי כהן", phone: "0501234567", group: "bride", role: "regular" },
      { name: "מיכל לוי", phone: "0502345678", group: "bride", role: "vip" },
      { name: "דוד ברק", phone: "0503456789", group: "groom", role: "regular" },
      { name: "שרה גולן", phone: "0504567890", group: "groom", role: "bridesmaid" },
      { name: "יוסי זכאי", phone: "0505678901", group: "mutual", role: "groomsman" },
    ];

    for (const guest of guestData) {
      const result = await connection.execute(
        `INSERT INTO guests (weddingId, name, phone, \`group\`, \`role\`, \`status\`, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [weddingId, guest.name, guest.phone, guest.group, guest.role, "pending"]
      );

      const guestId = result[0].insertId;

      // Create RSVP token for each guest
      const token = `demo-token-${guestId}-${Math.random().toString(36).substr(2, 9)}`;
      await connection.execute(
        `INSERT INTO rsvpTokens (weddingId, guestId, token, expiresAt, createdAt)
         VALUES (?, ?, ?, ?, NOW())`,
        [weddingId, guestId, token, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
      );

      console.log(`✅ Guest created: ${guest.name} (ID: ${guestId}, Token: ${token})`);
    }

    console.log("\n🎉 Seed data created successfully!");
    console.log(`Wedding ID: ${weddingId}`);
    console.log("Guests created: 5");
    console.log("\nYou can now:");
    console.log("1. Log in to the app");
    console.log("2. Go to Dashboard to see the wedding overview");
    console.log("3. Go to Guests to manage the demo guests");
    console.log("4. Share RSVP links with guests");

    await connection.end();
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    await connection.end();
    process.exit(1);
  }
}

seedWeddingData();
