// Load environment variables first (must be the first import)
import "dotenv/config";

import http from "node:http";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// Database connection
import "./models/db.js";

// Background workers (image and video processing)
import "./queues/image.worker.js";
import "./queues/video.worker.js";

// Socket service
import { initializeSocket } from "./services/socket.service.js";

const app = express();

/* =========================================================
   MIDDLEWARE
========================================================= */

// Allow only the configured frontend origin (not "*")
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.status(200).json({
    service: "media-service",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   HTTP SERVER + SOCKET.IO
========================================================= */

const server = http.createServer(app);

initializeSocket(server);

const port = Number(process.env.PORT) || 3000;

/* =========================================================
   START SERVER
========================================================= */

// listen() reports errors (e.g. port in use) through the "error" event
server.on("error", (error) => {
  console.error("Failed to start media service:", error);
  process.exit(1);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Media service listening on port ${port}`);
});

/* =========================================================
   GRACEFUL SHUTDOWN
========================================================= */

// Stop accepting new connections, then close the database before exiting
async function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);

  server.close(async () => {
    try {
      await mongoose.connection.close();
    } finally {
      process.exit(0);
    }
  });

  // Force exit if shutdown takes too long
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));