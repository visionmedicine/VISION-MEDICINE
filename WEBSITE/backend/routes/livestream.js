// routes/livestream.js
import express from "express";
import httpProxy from "http-proxy";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const proxy = httpProxy.createProxyServer({});

// Ambil dari .env
const RASPBERRY_URL = process.env.RASPBERRY_URL || "http://192.168.1.13:8000";
const API_TOKEN = process.env.API_TOKEN || "vismed-raspberry123";

// Endpoint livestream
router.get("/video", (req, res) => {
  console.log(`🔄 Proxying livestream dari ${RASPBERRY_URL}/video_feed`);

  // Override path agar query ?token ikut ter-forward
  req.url = `/video_feed?token=${API_TOKEN}`;

  proxy.web(req, res, {
    target: RASPBERRY_URL,
    changeOrigin: true,
    selfHandleResponse: false,
  });
});

// Error handling
proxy.on("error", (err, req, res) => {
  console.error("❌ Livestream proxy error:", err.message);
  if (!res.headersSent) {
    res.writeHead(502, { "Content-Type": "application/json" });
  }
  res.end(
    JSON.stringify({
      error: "Gagal connect ke Raspberry Pi livestream",
      detail: err.message,
    })
  );
});

export default router;
