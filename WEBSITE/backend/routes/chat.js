import express from "express";
import axios from "axios";

const router = express.Router();

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

if (!N8N_WEBHOOK_URL) {
  console.error("❌ N8N_WEBHOOK_URL belum diset di environment!");
}

router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ reply: "Pesan kosong 🚫" });
  }

  try {
    // Kirim ke n8n dengan timeout 30 detik
    const response = await axios.post(
      N8N_WEBHOOK_URL,
      { message },
      { timeout: 30000 }
    );

    // Log full response buat debugging
    console.log(
      "🔎 Full response dari n8n:",
      JSON.stringify(response.data, null, 2)
    );

    const aiReply =
      response.data?.reply ||
      response.data?.output ||
      response.data?.message || // ✅ langsung ambil message
      response.data?.[0]?.json?.message || // ✅ kalau n8n kirim array json
      response.data?.[0]?.message || // ✅ kalau array langsung tanpa json
      "VISMED tidak merespon 😅";

    res.json({ reply: aiReply });
  } catch (err) {
    console.error("❌ Error kirim ke n8n:", err.message);
    if (err.response?.data) {
      console.error("🔎 Response Error Body:", err.response.data);
    }
    res.status(500).json({ reply: "Terjadi error di server VISMED 😢" });
  }
});

export default router;
