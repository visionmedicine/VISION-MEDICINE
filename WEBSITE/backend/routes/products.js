import express from "express";
import { supabase, productsBucket } from "../supabase.js";

const router = express.Router();

// GET /api/products
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .storage
      .from(productsBucket)
      .list("", { limit: 100, offset: 0 });

    if (error) throw error;

    const productFiles = data.map((file) => {
      return {
        name: file.name,
        url: supabase.storage.from(productsBucket).getPublicUrl(file.name).data.publicUrl,
      };
    });

    res.json(productFiles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch product images" });
  }
});

export default router;
