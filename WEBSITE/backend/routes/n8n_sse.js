// ===============================
// n8n_sse.js — versi 2025-10 (Hanya pakai "output")
// ===============================

import express from "express";
const router = express.Router();

// List koneksi aktif (client SSE)
let clients = [];

// -------------------------------
// 🔌 Endpoint SSE Stream
// -------------------------------
router.get("/stream", (req, res) => {
  console.log("🟢 Client tersambung ke /api/n8n/stream");

  // Header wajib untuk SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Simpan koneksi client
  clients.push(res);

  // Hapus client jika terputus
  req.on("close", () => {
    console.log("🔴 Client terputus dari SSE");
    clients = clients.filter((c) => c !== res);
  });
});

// -------------------------------
// 📩 Endpoint untuk menerima data dari n8n
// -------------------------------
router.post("/send", (req, res) => {
  const data = req.body;
  console.log("📨 Data masuk dari n8n:", data);

  if (!data) {
    console.warn("⚠️ Tidak ada data di body request");
    return res.status(400).json({ error: "Body kosong" });
  }

  // Buat payload standar untuk SSE
  const payload = {
    id: data.id || Date.now().toString(),
    timestamp: data.timestamp || new Date().toISOString(),
    output: null, // default null
  };

  // 🧠 Ambil isi dari field "output" dari n8n
  if (typeof data.output === "string") {
    payload.output = data.output;
  } else if (Array.isArray(data.output)) {
    // Jika bentuknya array seperti [{ output: "..." }]
    payload.output = data.output
      .map((item) => item.output || JSON.stringify(item))
      .join("\n");
  } else {
    payload.output = JSON.stringify(data);
  }

  // Kirim ke semua client SSE
  const jsonString = `data: ${JSON.stringify(payload)}\n\n`;
  clients.forEach((client) => client.write(jsonString));

  console.log(`📤 Broadcast ke ${clients.length} client:\n`, payload.output);

  res.status(200).json({ success: true, received: data });
});

// -------------------------------
// 🧩 Export router
// -------------------------------
export default router;
