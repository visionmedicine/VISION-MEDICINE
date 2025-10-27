// ===========================================
// routes/livestream.js
// ===========================================

import express from "express";
import httpProxy from "http-proxy";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const router = express.Router();
const proxy = httpProxy.createProxyServer({});

// ===========================================
// ENV CONFIG
// ===========================================
const RASPBERRY_URL = process.env.RASPBERRY_URL || "http://192.168.1.16:8000";
const API_TOKEN = process.env.API_TOKEN || "vismed-raspberry123";
const N8N_SSE_URL =
  process.env.N8N_SSE_URL || "http://localhost:5000/api/n8n/sse"; // ➕ tambahkan route SSE backend

// ===========================================
// LIVESTREAM ENDPOINT (EXISTING CODE)
// ===========================================
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

// ===========================================
// ERROR HANDLING
// ===========================================
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

// ===========================================
// 🔥 SSE INTEGRATION KE N8N
// ===========================================
// Endpoint untuk ngetes hasil deteksi dari n8n
router.post("/n8n-message", async (req, res) => {
  try {
    const body = req.body;
    console.log("📡 [Livestream] Data dari n8n:", body);

    // Kirim event ke SSE client
    if (global.sseClients && global.sseClients.length > 0) {
      global.sseClients.forEach((client) => {
        client.res.write(`data: ${JSON.stringify(body)}\n\n`);
      });
      console.log(`✅ [SSE] Dikirim ke ${global.sseClients.length} client`);
    } else {
      console.log("⚠️ [SSE] Tidak ada client yang tersambung");
    }

    res.status(200).json({ success: true, received: body });
  } catch (err) {
    console.error("❌ [Livestream SSE Error]:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===========================================
// 🔁 ROUTE UNTUK SSE CONNECTION
// ===========================================
router.get("/events", (req, res) => {
  console.log("👀 [SSE] Client terhubung ke /livestream/events");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  global.sseClients = global.sseClients || [];
  global.sseClients.push(newClient);

  // Kirim status awal
  res.write(
    `data: ${JSON.stringify({ status: "connected", id: clientId })}\n\n`
  );

  // Hapus client jika koneksi putus
  req.on("close", () => {
    console.log("❌ [SSE] Client terputus:", clientId);
    global.sseClients = global.sseClients.filter((c) => c.id !== clientId);
  });
});

// ===========================================
// 🔗 TEST CONNECTION TO N8N (OPTIONAL)
// ===========================================
router.get("/test-n8n", async (req, res) => {
  try {
    const resp = await fetch(N8N_SSE_URL);
    console.log("✅ [N8N Test] Terhubung ke:", N8N_SSE_URL);
    res.json({ ok: true, target: N8N_SSE_URL });
  } catch (err) {
    console.error("❌ [N8N Test] Gagal konek:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
