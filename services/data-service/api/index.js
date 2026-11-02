
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { connectDB } from "./db.js";

import usersRouter from "../routes/users.vercel.routes.js";
import authRouter from "../routes/auth.vercel.routes.js";
import activityRouter from "../routes/activity.routes.js";
import organizationRouter from "../routes/organization.routes.js";
import statsRouter from "../routes/stats.routes.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "https://ur-companion-dgqvy1jdq-pratiksha-portfolio1.vercel.app",
  "https://ur-companion-three.vercel.app",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("Blocked CORS Origin:", origin);
    return callback(new Error("CORS: Origin not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    service: "activity-companion-api",
    status: "ok",
  });
});

// Connect MongoDB before handling API requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);

    res.status(503).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Authentication APIs
app.use("/api/auth", authRouter);

// Data APIs
app.use("/api/data/users", usersRouter);
app.use("/api/data/activities", activityRouter);
app.use("/api/data/organizations", organizationRouter);
app.use("/api/data/stats", statsRouter);

export default app;
