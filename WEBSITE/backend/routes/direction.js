const express = require("express");
const db = require("../firebase");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    await db.ref("actions/guide").set({ pressed: true, time: Date.now() });
    res.json({ message: "Guide ditekan 🧭" });
  } catch (err) {
    res.status(500).json({ error: "Gagal trigger guide" });
  }
});

module.exports = router;
