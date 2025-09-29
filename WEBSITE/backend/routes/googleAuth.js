// routes/googleAuth.js
import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI // harus sama dengan yang ada di Google Cloud Console
);

// GET /api/google/auth → balikin URL login
router.get("/auth", (req, res) => {
  const scopes = ["https://www.googleapis.com/auth/calendar.events"];
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
  res.json({ url });
});

// GET /api/google/callback → tuker code jadi tokens
router.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code");

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.json({
      tokens,
      note: "Copy refresh_token ke .env sebagai GOOGLE_REFRESH_TOKEN",
    });
  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).send(String(err));
  }
});

export default router;
