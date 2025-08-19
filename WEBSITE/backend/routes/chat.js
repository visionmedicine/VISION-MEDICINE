// routes/chat.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ reply: "Pesan kosong 🚫" });
  }

  try {
    const response = await axios.post(N8N_WEBHOOK_URL, { message });

    // 🔎 n8n balikin { output: "..." }, bukan { reply: "..." }
    const aiReply =
      response.data?.reply ||
      response.data?.output ||
      "VISMED tidak merespon 😅";

    console.log("🔎 Respon dari n8n:", response.data);

    res.json({ reply: aiReply });
  } catch (err) {
    console.error("❌ Error kirim ke n8n:", err.message);
    res.status(500).json({ reply: "Terjadi error di server VISMED 😢" });
  }
});

module.exports = router;
