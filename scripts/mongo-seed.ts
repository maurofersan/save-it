/**
 * Seed inicial para MongoDB Atlas (especialidades + usuario residente demo).
 * Requiere: MONGODB_URI y opcionalmente MONGODB_DB=saveit
 *
 *   npm run db:seed
 */
import crypto from "node:crypto";
import { MongoClient } from "mongodb";
import { ensureUserEmailUniqueIndex } from "./ensureUserEmailUniqueIndex";

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Define MONGODB_URI (p. ej. en .env.local)");
  const dbName = process.env.MONGODB_DB ?? "saveit";

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(dbName);
    await ensureUserEmailUniqueIndex(db);

    const specialties = db.collection("specialties");
    for (const [key, name] of [
      ["QUALITY", "Calidad"],
      ["SAFETY", "Seguridad"],
      ["PRODUCTION", "Producción"],
    ] as const) {
      await specialties.updateOne(
        { key },
        { $set: { key, name } },
        { upsert: true },
      );
    }
    console.log("Specialties OK (QUALITY / SAFETY / PRODUCTION).");

    const orgs = db.collection("organizations");
    const orgSlug = "saveit-demo";
    let org = await orgs.findOne({ slug: orgSlug });
    const now = new Date().toISOString();
    if (!org) {
      const { insertedId } = await orgs.insertOne({
        name: "SAVE IT Demo",
        slug: orgSlug,
        logoUrl: null,
        createdAt: now,
        updatedAt: now,
      });
      org = await orgs.findOne({ _id: insertedId });
      console.log("Organización demo creada (slug: saveit-demo).");
    } else {
      console.log("Organización demo ya existe.");
    }
    if (!org) throw new Error("Failed to ensure organization");

    const users = db.collection("users");
    const email = "resident@saveit.local";
    const existing = await users.findOne({ email });
    if (!existing) {
      const salt = crypto.randomBytes(16);
      const hash = crypto.scryptSync("Resident123!", salt, 64);
      await users.insertOne({
        name: "Ingeniero Residente",
        email,
        phone: null,
        title: "Residente",
        avatarUrl: null,
        role: "RESIDENT",
        organizationId: org._id,
        passwordSaltHex: salt.toString("hex"),
        passwordHashHex: hash.toString("hex"),
        createdAt: now,
        updatedAt: now,
      });
      console.log("Usuario demo: resident@saveit.local / Resident123!");
    } else {
      if (!("organizationId" in existing) || !existing.organizationId) {
        await users.updateOne(
          { email },
          { $set: { organizationId: org._id, updatedAt: now } },
        );
        console.log("Usuario demo existía sin empresa; asignada a SAVE IT Demo.");
      } else {
        console.log("Usuario residente ya existe, no se modifica.");
      }
    }

    console.log("Seed completado.");
  } finally {
    await client.close();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
