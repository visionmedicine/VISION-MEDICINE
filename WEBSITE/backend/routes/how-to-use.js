import express from "express";
import { supabase, howToUseBucket } from "../services/supabase.js";

const router = express.Router();

// GET /api/how-to-use
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .storage
      .from(howToUseBucket)
      .list("", { limit: 100, offset: 0 });

    if (error) throw error;

    const howToUseFiles = data.map((file) => ({
      name: file.name,
      url: supabase.storage.from(howToUseBucket).getPublicUrl(file.name).data.publicUrl,
    }));

    res.json(howToUseFiles);
  } catch (err) {
    console.error("❌ Failed to fetch how-to-use images:", err.message);
    res.status(500).json({ error: "Failed to fetch how-to-use images" });
  }
});

export default router;
