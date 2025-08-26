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
    // Kirim ke n8n dengan timeout 10 detik
    const response = await axios.post(
      N8N_WEBHOOK_URL,
      { message },
      { timeout: 10000 }
    );

    // Log full response buat debugging
    console.log(
      "🔎 Full response dari n8n:",
      JSON.stringify(response.data, null, 2)
    );

    const aiReply =
      response.data?.reply ||
      response.data?.output ||
      response.data?.[0]?.json?.reply || // fallback kalau n8n kasih array json
      "VISMED tidak merespon 😅";

    res.json({ reply: aiReply });
  } catch (err) {
    console.error("❌ Error kirim ke n8n:", err.message);
    res.status(500).json({ reply: "Terjadi error di server VISMED 😢" });
  }
});

export default router;
