import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB, { dbStatus } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
connectDB();

const app = express();

/**
 * Allowed browser origins.
 *
 * CLIENT_URL and ADMIN_URL each accept a comma-separated list, so a single
 * deploy can serve a production domain and a preview URL at once. Requests
 * without an Origin header (curl, health checks, server-to-server) are
 * always allowed — CORS only governs browsers.
 */
const allowedOrigins = [process.env.CLIENT_URL, process.env.ADMIN_URL]
  .filter(Boolean)
  .flatMap((v) => v.split(","))
  .map((v) => v.trim().replace(/\/$/, ""))
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  allowedOrigins.push("http://localhost:5173", "http://localhost:5174");
}

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      const clean = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(clean)) return cb(null, true);
      return cb(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

/**
 * Health check.
 *
 * Reports the DATABASE state, not merely that the process is running. Every
 * meaningful route needs Mongo, so a reachable server with a dead database
 * is not healthy — returning 200 there would let a platform keep routing
 * traffic to an instance that fails every request.
 *
 *   200 + {"status":"ok"}        database connected
 *   503 + {"status":"degraded"}  process up, database unreachable
 */
app.get("/api/health", (req, res) => {
  const db = dbStatus();

  // A storefront whose origin is missing from CLIENT_URL still renders — it
  // silently falls back to its bundled catalogue — so this misconfiguration
  // is invisible from the outside. Surface it here, where monitoring looks.
  const configured = allowedOrigins.filter((o) => !/localhost/.test(o));
  const corsWarning =
    configured.length === 0
      ? "CLIENT_URL and ADMIN_URL are unset, so only localhost origins are allowed. " +
        "Any deployed storefront will be refused and will serve stale data."
      : null;

  const ok = db.ok && !corsWarning;
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "degraded",
    name: "Chikwafu API",
    uptime: Math.round(process.uptime()),
    database: db,
    cors: { allowedOrigins, warning: corsWarning },
  });
});

/**
 * Ask whether a specific origin is allowed, without needing a browser:
 *   /api/health/origin?url=https://chikwafu.com
 * Lets a deploy check confirm CORS before customers hit a stale shop.
 */
app.get("/api/health/origin", (req, res) => {
  const url = String(req.query.url || "").trim().replace(/\/$/, "");
  if (!url) {
    return res.status(400).json({
      message: "Pass ?url=https://your-site.example to check an origin.",
    });
  }
  const allowed = allowedOrigins.includes(url);
  res.status(allowed ? 200 : 409).json({
    origin: url,
    allowed,
    allowedOrigins,
    ...(allowed
      ? {}
      : {
          fix:
            `Add ${url} to CLIENT_URL (or ADMIN_URL) on the API service. ` +
            "Both accept a comma-separated list. Redeploy for it to take effect.",
        }),
  });
});

/** Liveness only — is the process alive? Used to tell "restart me" apart
 *  from "my dependency is down". */
app.get("/api/health/live", (req, res) =>
  res.json({ status: "alive", uptime: Math.round(process.uptime()) }),
);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Chikwafu API running on port ${PORT}`);
  console.log(`CORS allows: ${allowedOrigins.join(", ")}`);
});
