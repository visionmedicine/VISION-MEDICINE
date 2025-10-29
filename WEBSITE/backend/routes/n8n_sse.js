// ===========================================
// routes/n8n_sse.js - Handle SSE for n8n integration with buffer & dedup
// ===========================================

import express from "express";

const router = express.Router();

// ➕ GLOBAL: SSE clients & pending messages buffer
global.n8nSseClients = global.n8nSseClients || [];
global.pendingN8nMessages = global.pendingN8nMessages || [];

// ➕ FIX: Helper untuk dedup (cek uniqueness berdasarkan output)
const isDuplicateMessage = (newMsg, existing) => {
  const newOutput = newMsg.output?.substring(0, 100) || ""; // Hash sederhana
  return existing.some(
    (msg) => (msg.output?.substring(0, 100) || "") === newOutput
  );
};

// ===========================================
// POST /api/n8n/send - Receive from n8n & broadcast/buffer
// ===========================================
router.post("/send", async (req, res) => {
  try {
    const body = req.body;
    console.log("📨 Data masuk dari n8n:", body);

    const message = body; // Atau parse jika perlu

    // ➕ FIX: Dedup sebelum buffer/broadcast
    if (isDuplicateMessage(message, global.pendingN8nMessages)) {
      console.log("⏭️ Skip duplicate n8n message");
      return res.status(200).json({ success: true, skipped: "duplicate" });
    }

    // ➕ FIX: Buffer jika no client, broadcast jika ada
    if (global.n8nSseClients.length > 0) {
      global.n8nSseClients.forEach((client) => {
        client.res.write(`data: ${JSON.stringify(message)}\n\n`);
      });
      console.log(
        `📤 Broadcast ke ${global.n8nSseClients.length} client:`,
        message.output?.substring(0, 100) + "..."
      );
    } else {
      global.pendingN8nMessages.push(message);
      console.log("📤 No client: Buffered message untuk nanti");
    }

    res.status(200).json({ success: true, received: body });
  } catch (err) {
    console.error("❌ [n8n POST Error]:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===========================================
// GET /api/n8n/stream - SSE connection
// ===========================================
router.get("/stream", (req, res) => {
  console.log("🟢 Client tersambung ke /api/n8n/stream");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  global.n8nSseClients.push(newClient);

  // ➕ FIX: Kirim pending messages (dedup di buffer sudah handle)
  if (global.pendingN8nMessages.length > 0) {
    console.log(
      `📤 Mengirim ${global.pendingN8nMessages.length} pending messages ke client baru`
    );
    global.pendingN8nMessages.forEach((msg) => {
      res.write(`data: ${JSON.stringify(msg)}\n\n`);
    });
    global.pendingN8nMessages = []; // Clear buffer
  }

  // Kirim status awal
  res.write(
    `data: ${JSON.stringify({ status: "connected", id: clientId })}\n\n`
  );

  // Hapus client jika koneksi putus
  req.on("close", () => {
    console.log("❌ [n8n SSE] Client terputus:", clientId);
    global.n8nSseClients = global.n8nSseClients.filter(
      (c) => c.id !== clientId
    );
  });
});

export default router;
