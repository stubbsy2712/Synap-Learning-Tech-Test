import { MongoClient, Db } from "mongodb";

const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME ?? "Synap-Tech-Test";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) {
    return db;
  }

  client = new MongoClient(MONGO_URI);
  await client.connect();

  db = client.db(DB_NAME);
  return db;
}