import { Db, MongoClient } from "mongodb";

const url = process.env.CONNECTION_STRING;

if (!url) throw new Error("Connection string is undefined");

let db: Db | null = null;

export const connectToDatabase = async (): Promise<Db> => {
  if (db) return db;
  const client = new MongoClient(url);

  await client.connect();
  return (db = client.db("hboKeuzeDeel"));
};
