import axios from "axios";

/**
 * VITE_API_URL may be given with or without the /api suffix — Render's
 * RENDER_EXTERNAL_URL supplies the bare host, while a local .env usually
 * includes it. Normalise so both work.
 */
const raw = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const baseURL = raw.endsWith("/api") ? raw : `${raw}/api`;

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("chikwafu_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
