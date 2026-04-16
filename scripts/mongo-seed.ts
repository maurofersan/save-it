/**
 * Seed inicial para MongoDB Atlas (especialidades + usuario residente demo).
 * Requiere: MONGODB_URI y opcionalmente MONGODB_DB=saveit
 *
 *   npm run db:seed
 */
import crypto from "node:crypto";
import { MongoClient } from "mongodb";

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Define MONGODB_URI (p. ej. en .env.local)");
  const dbName = process.env.MONGODB_DB ?? "saveit";

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(dbName);

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
        company: "SAVE IT",
        title: "Residente",
        role: "RESIDENT",
        passwordSaltHex: salt.toString("hex"),
        passwordHashHex: hash.toString("hex"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log("Usuario demo: resident@saveit.local / Resident123!");
    } else {
      console.log("Usuario residente ya existe, no se modifica.");
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
