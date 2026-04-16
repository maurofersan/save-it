import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri && process.env.NODE_ENV !== "test") {
  console.warn("MONGODB_URI is not set");
}

declare global {
  // eslint-disable-next-line no-var -- Next.js dev HMR cache
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  if (process.env.NODE_ENV === "development") {
    if (!globalThis._mongoClientPromise) {
      const client = new MongoClient(uri);
      globalThis._mongoClientPromise = client.connect();
    }
    return globalThis._mongoClientPromise;
  }
  const client = new MongoClient(uri);
  return client.connect();
}

export async function getMongoDb(): Promise<Db> {
  const client = await getClientPromise();
  const name = process.env.MONGODB_DB ?? "saveit";
  return client.db(name);
}
