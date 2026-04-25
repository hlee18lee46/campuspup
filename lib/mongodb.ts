// lib/mongodb.ts

import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI!;

if (!uri) {
  throw new Error("Please add MONGO_URI to .env.local");
}

const client = new MongoClient(uri);
const clientPromise = client.connect();

export default clientPromise;