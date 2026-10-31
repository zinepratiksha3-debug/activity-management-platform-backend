// Load environment variables first (must be the first import)
import "dotenv/config";
import "./model/db.js";
import statsRouter from "./routes/stats.routes.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import organizationRouter from "./routes/organization.routes.js";
import userRouter from "./routes/routes.js";
import mediaRouter from "./routes/media.routes.js";
import authRouter from "./routes/auth.routes.js";
import activityRouter from "./routes/activity.routes.js";

const app = express();
app.set("trust proxy", 1);
// =========================
// MIDDLEWARE
// =========================

// Set secure HTTP headers
app.use(helmet());

// Allow requests only from the configured frontend origin
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));

const port = process.env.PORT || 4000;

// =========================
// HEALTH CHECK
// =========================

app.get("/", (req, res) => {
  res.status(200).json({ service: "data-service", status: "ok" });
});

// =========================
// ROUTES
// =========================

app.use("/users", userRouter);
app.use("/media", mediaRouter);
app.use("/auth", authRouter);
app.use("/stats", statsRouter);
app.use("/organizations", organizationRouter);
app.use("/activities", activityRouter);
// =========================
// SERVER
// =========================

app.listen(port, "0.0.0.0", () => {
  console.log(`Data service listening on port ${port}`);
});