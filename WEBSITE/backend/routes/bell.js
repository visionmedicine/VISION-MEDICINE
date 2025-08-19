const express = require("express");
const db = require("../firebase");
const router = express.Router();

// Tombol Bel ditekan → update status di Firebase
router.post("/", async (req, res) => {
  try {
    await db.ref("actions/bell").set({ pressed: true, time: Date.now() });
    res.json({ message: "Bel ditekan 🚨" });
  } catch (err) {
    res.status(500).json({ error: "Gagal trigger bel" });
  }
});

module.exports = router;
