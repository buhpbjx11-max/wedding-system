import mysql from "mysql2/promise";
import { nanoid } from "nanoid";

const pool = mysql.createPool({
  host: process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "localhost",
  user: process.env.DATABASE_URL?.split("://")[1]?.split(":")[0] || "root",
  password: process.env.DATABASE_URL?.split(":")[2]?.split("@")[0] || "",
  database: process.env.DATABASE_URL?.split("/").pop() || "wedding_os",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function seedDemo() {
  const connection = await pool.getConnection();

  try {
    console.log("🌱 Starting demo seed...");

    // Get or create a wedding for demo
    const [weddings] = await connection.query(
      "SELECT id FROM weddings LIMIT 1"
    );

    let weddingId;
    if (weddings.length > 0) {
      weddingId = weddings[0].id;
      console.log("✅ Using existing wedding ID:", weddingId);
    } else {
      // Create a demo wedding
      const [result] = await connection.query(
        "INSERT INTO weddings (ownerOpenId, brideName, groomName, weddingDate) VALUES (?, ?, ?, ?)",
        ["demo-owner", "כלה", "חתן", new Date("2024-12-25")]
      );
      weddingId = result.insertId;
      console.log("✅ Created demo wedding ID:", weddingId);
    }

    // Check if demo guest already exists
    const [existingGuests] = await connection.query(
      "SELECT id FROM guests WHERE weddingId = ? AND email = ?",
      [weddingId, "demo@example.com"]
    );

    let guestId;
    if (existingGuests.length > 0) {
      guestId = existingGuests[0].id;
      console.log("✅ Using existing demo guest ID:", guestId);
    } else {
      // Create a demo guest
      const [result] = await connection.query(
        "INSERT INTO guests (weddingId, name, email, phone, side, status) VALUES (?, ?, ?, ?, ?, ?)",
        [weddingId, "אורח דמו", "demo@example.com", "050-1234567", "bride", "pending"]
      );
      guestId = result.insertId;
      console.log("✅ Created demo guest ID:", guestId);
    }

    // Create or update RSVP token
    const demoToken = "demo-token-12345";

    const [existingTokens] = await connection.query(
      "SELECT id FROM rsvp_tokens WHERE guestId = ?",
      [guestId]
    );

    if (existingTokens.length > 0) {
      await connection.query(
        "UPDATE rsvp_tokens SET token = ? WHERE guestId = ?",
        [demoToken, guestId]
      );
      console.log("✅ Updated demo RSVP token");
    } else {
      await connection.query(
        "INSERT INTO rsvp_tokens (guestId, token, expiresAt) VALUES (?, ?, ?)",
        [guestId, demoToken, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)]
      );
      console.log("✅ Created demo RSVP token");
    }

    console.log("\n🎉 Demo seed complete!");
    console.log("📝 Demo RSVP Link: /guest-rsvp/demo-token-12345");
    console.log("👤 Demo Guest: אורח דמו (demo@example.com)");
  } catch (error) {
    console.error("❌ Seed error:", error);
    throw error;
  } finally {
    await connection.release();
    await pool.end();
  }
}

seedDemo().catch(console.error);
