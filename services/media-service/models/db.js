import mongoose from "mongoose";

const DB_URL = process.env.MONGO_DB_URL;

if (!DB_URL) {
  throw new Error("MONGO_DB_URL is missing");
}

const connection = mongoose.connection;

mongoose.connect(DB_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection failed:", error.message));

connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

export default connection;
