import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
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

app.get("/api/health", (req, res) => res.json({ status: "ok", name: "Chikwafu API" }));

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
