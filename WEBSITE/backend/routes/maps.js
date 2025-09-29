// backend/routes/maps.js
import express from "express";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Simpan lokasi VISMED terakhir
let vismedLocation = { lat: null, lng: null };

// Token untuk ESP32 dari .env
const ESP32_SHARED_TOKEN = process.env.ESP32_SHARED_TOKEN;

// 🔄 Update lokasi ESP32
router.post("/update", (req, res) => {
  const token = req.query.token;
  if (token !== ESP32_SHARED_TOKEN)
    return res.status(403).json({ ok: false, msg: "Unauthorized" });

  const { lat, lng } = req.body;
  if (lat == null || lng == null)
    return res.status(400).json({ ok: false, msg: "Invalid data" });

  vismedLocation.lat = lat;
  vismedLocation.lng = lng;

  console.log("📍 VISMED location updated:", vismedLocation);
  res.json({ ok: true });
});

// 🔄 Ambil lokasi VISMED terakhir
router.get("/", (req, res) => {
  if (vismedLocation.lat == null || vismedLocation.lng == null)
    return res.json({ ok: false, msg: "No location yet" });

  res.json({ ok: true, location: vismedLocation });
});

export default router; // ✅ ESM default export
