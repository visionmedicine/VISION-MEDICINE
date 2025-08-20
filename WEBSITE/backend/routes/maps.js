// backend/routes/maps.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

router.get("/", async (req, res) => {
  try {
    // contoh lokasi Jakarta
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=-6.200000,106.816666&key=${GOOGLE_MAPS_API_KEY}`
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ Error ambil lokasi:", err.message);
    res.status(500).json({ error: "Gagal ambil lokasi" });
  }
});

export default router;
