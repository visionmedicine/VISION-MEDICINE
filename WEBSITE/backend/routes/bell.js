import express from "express";
import { supabase, audioBucket } from "../services/supabase.js";

const router = express.Router();
const REQUIRED_TOKEN = process.env.ESP32_SHARED_TOKEN;

async function getPublicAudioUrl(path) {
  const { data } = await supabase.storage.from(audioBucket).getPublicUrl(path);
  return data.publicUrl;
}

// 📌 Create command
router.post("/", async (req, res) => {
  try {
    const audioPath =
      req.body?.audioPath ||
      process.env.DEFAULT_AUDIO_PATH ||
      "";
    const publicUrl = await getPublicAudioUrl(audioPath);

    const { data, error } = await supabase
      .from("commands")
      .insert({
        type: "bell",
        status: "pending",
        payload: { url: publicUrl, path: audioPath },
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ ok: true, command: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create bell command" });
  }
});

// 📌 ESP32 GET command
router.get("/esp32/command", async (req, res) => {
  try {
    const token = req.query.token;
    if (!REQUIRED_TOKEN || token !== REQUIRED_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: rows, error: selErr } = await supabase
      .from("commands")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1);

    if (selErr) return res.status(500).json({ error: selErr.message });

    if (!rows || rows.length === 0) {
      return res.json({ ok: true, command: null });
    }

    const cmd = rows[0];

    const { error: updErr } = await supabase
      .from("commands")
      .update({ status: "sent", delivered_at: new Date().toISOString() })
      .eq("id", cmd.id);

    if (updErr) return res.status(500).json({ error: updErr.message });

    res.json({
      ok: true,
      command: { id: cmd.id, type: cmd.type, payload: cmd.payload },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch next command" });
  }
});

// 📌 ESP32 ACK
router.post("/esp32/ack/:id", async (req, res) => {
  try {
    const token = req.query.token;
    if (!REQUIRED_TOKEN || token !== REQUIRED_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { error } = await supabase
      .from("commands")
      .update({ status: "done" })
      .eq("id", id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to ack command" });
  }
});

export default router;
