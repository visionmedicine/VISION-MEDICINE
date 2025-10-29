// ===========================================
// routes/detections.js - UPDATED: Strip invalid ID for UUID
// Handle CRUD for detections via Supabase
// ===========================================

import express from "express";
import {
  saveDetection,
  getDetections,
  clearDetections,
} from "../services/supabase.js"; // Import dari supabase.js

const router = express.Router();

// ===========================================
// GET /api/detections - Fetch all detections
// ===========================================
router.get("/", async (req, res) => {
  try {
    console.log("📡 [Detections] Fetching all detections");
    const data = await getDetections();
    res.json(data);
  } catch (err) {
    console.error("❌ [Detections GET Error]:", err.message);
    res.status(500).json({ error: "Failed to fetch detections" });
  }
});

// ===========================================
// POST /api/detections - Save new detection
// ===========================================
router.post("/", async (req, res) => {
  try {
    let detection = req.body;
    console.log("💾 [Detections] Saving new detection (raw):", detection);

    // ➕ FIX: Strip 'id' jika ada (biar Supabase generate UUID otomatis)
    const { id, ...detectionWithoutId } = detection;
    console.log("💾 [Detections] Saving (without id):", detectionWithoutId);

    const saved = await saveDetection(detectionWithoutId);
    console.log("✅ [Detections] Saved with UUID:", saved.id);

    res.status(201).json(saved); // ➕ Return saved data dengan UUID baru
  } catch (err) {
    console.error("❌ [Detections POST Error]:", err.message);
    res
      .status(500)
      .json({ error: "Failed to save detection", detail: err.message });
  }
});

// ===========================================
// DELETE /api/detections - Clear all detections
// ===========================================
router.delete("/", async (req, res) => {
  try {
    console.log("🗑️ [Detections] Clearing all detections");
    await clearDetections();
    res.json({ success: true, message: "All detections cleared" });
  } catch (err) {
    console.error("❌ [Detections DELETE Error]:", err.message);
    res.status(500).json({ error: "Failed to clear detections" });
  }
});

export default router;
