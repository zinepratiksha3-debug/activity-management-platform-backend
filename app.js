// media-service/app.js

import http from "node:http";
import express from "express";
import cors from "cors";

// Database connection
import "./models/db.js";
import statsRouter from "./routes/stats.routes.js";
// Background workers
import "./queues/image.worker.js";
import "./queues/video.worker.js";

// Socket service
import { initializeSocket } from "./services/socket.service.js";

const app = express();

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use("/stats", statsRouter);
app.get("/", (req, res) => {
  res.status(200).json({
    service: "media-service",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   HTTP SERVER
========================================================= */

const server = http.createServer(app);

/* =========================================================
   SOCKET.IO
========================================================= */

initializeSocket(server);

/* =========================================================
   PORT
========================================================= */

const port = Number(process.env.PORT) || 3000;

/* =========================================================
   START SERVER
========================================================= */

async function start() {
  try {
    server.listen(port, "0.0.0.0", () => {
      console.log(
        `Media service listening on port ${port}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start media service:",
      error
    );

    process.exit(1);
  }
}

start();