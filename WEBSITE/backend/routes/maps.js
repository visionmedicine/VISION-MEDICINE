const express = require("express");
const axios = require("axios");
require("dotenv").config();

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
    res.status(500).json({ error: "Gagal ambil lokasi" });
  }
});

module.exports = router;
