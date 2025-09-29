// routes/reminder.js
import express from "express";
import { google } from "googleapis";
import { supabase } from "../services/supabase.js";

const router = express.Router();
const TIMEZONE = process.env.TIMEZONE || "Asia/Jakarta";

// === Setup OAuth2 Client ===
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

if (!process.env.GOOGLE_REFRESH_TOKEN) {
  throw new Error(
    "❌ GOOGLE_REFRESH_TOKEN is missing. Run OAuth flow first to generate one."
  );
}

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

// === Helper buat datetime ===
function buildDateTimes(dateStr, hourStr, minuteStr, durationMinutes = 15) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const h = Number(hourStr);
  const min = Number(minuteStr);
  const start = new Date(y, m - 1, d, h, min, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * POST /api/reminder/create
 * Body: { user_email, summary, description?, date, hour, minute, durationMinutes?, calendarId? }
 */
router.post("/create", async (req, res) => {
  try {
    const {
      user_email,
      summary,
      description = "",
      date,
      hour,
      minute,
      durationMinutes = 15,
      calendarId = "primary",
    } = req.body;

    if (
      !user_email ||
      !summary ||
      !date ||
      hour === undefined ||
      minute === undefined
    ) {
      return res.status(400).json({
        error:
          "Missing required fields (user_email, summary, date, hour, minute)",
      });
    }

    const { start, end } = buildDateTimes(date, hour, minute, durationMinutes);

    const eventResource = {
      summary,
      description,
      start: { dateTime: start, timeZone: TIMEZONE },
      end: { dateTime: end, timeZone: TIMEZONE },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 5 },
          { method: "email", minutes: 10 },
        ],
      },
    };

    // === Insert ke Google Calendar ===
    const result = await calendar.events.insert({
      calendarId,
      resource: eventResource,
    });

    const created = result.data;
    const eventId = created.id;

    // === Insert mapping ke Supabase ===
    const { data, error } = await supabase.from("reminder_events").insert([
      {
        user_email,
        event_id: eventId,
        summary,
        start: created.start?.dateTime || created.start?.date,
        end: created.end?.dateTime || created.end?.date,
        metadata: created, // pastikan kolom metadata tipe jsonb
      },
    ]);

    if (error) {
      console.error("❌ Supabase insert error:", error.message);
      return res.status(500).json({
        error: "Event created but failed to persist mapping",
        details: error.message,
      });
    }

    return res.json({ ok: true, eventId, created, supabase: data });
  } catch (err) {
    console.error("❌ Create event error:", err.message);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

/**
 * POST /api/reminder/delete
 * Body: { user_email, event_id, calendarId? }
 */
router.post("/delete", async (req, res) => {
  try {
    const { user_email, event_id, calendarId = "primary" } = req.body;
    if (!user_email || !event_id) {
      return res.status(400).json({ error: "Missing user_email or event_id" });
    }

    // === Delete dari Google Calendar ===
    await calendar.events.delete({
      calendarId,
      eventId: event_id,
    });

    // === Delete mapping dari Supabase ===
    const { data, error } = await supabase
      .from("reminder_events")
      .delete()
      .eq("event_id", event_id)
      .eq("user_email", user_email);

    if (error) {
      console.error("❌ Supabase delete error:", error.message);
      return res.status(500).json({
        error: "Event deleted from Google but failed to remove mapping",
        details: error.message,
      });
    }

    return res.json({ ok: true, removed: data?.length || 0 });
  } catch (err) {
    console.error("❌ Delete event error:", err.message);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
