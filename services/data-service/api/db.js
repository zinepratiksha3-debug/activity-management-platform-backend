import mongoose from "mongoose";

let connectionPromise = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    const DB_URL = process.env.MONGO_DB_URL;

    if (!DB_URL) {
      throw new Error("MONGO_DB_URL is missing");
    }

    connectionPromise = mongoose.connect(DB_URL, {
      serverSelectionTimeoutMS: 10000,
    }).catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;

  return mongoose.connection;
}