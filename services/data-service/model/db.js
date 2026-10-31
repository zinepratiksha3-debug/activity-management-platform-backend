import mongoose from "mongoose";

const DB_URL = process.env.MONGO_DB_URL;

if (!DB_URL) {
  throw new Error("MONGO_DB_URL is missing");
}

mongoose
  .connect(DB_URL)
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

const connection = mongoose.connection;

connection.on("connected", () => {
  console.log("MongoDB connected");
});

connection.on("error", (error) => {
  console.error("MongoDB connection error:", error.message);
});

connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

export default connection;