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
 */
router.post("/create", async (req, res) => {
  try {
    console.log("📩 [CREATE] Incoming body:", req.body);

    const {
      user_email,
      summary,
      description = "",
      date,
      hour,
      minute,
      durationMinutes = 15,
      calendarId = "primary",
      active = true,
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

    if (!active) {
      console.log("⚠️ Reminder nonaktif → skip create");
      return res.json({
        ok: true,
        skipped: true,
        message: "Reminder nonaktif, tidak dibuat di Google & Supabase",
      });
    }

    const { start, end } = buildDateTimes(date, hour, minute, durationMinutes);

    const eventResource = {
      summary,
      description,
      start: { dateTime: start, timeZone: TIMEZONE },
      end: { dateTime: end, timeZone: TIMEZONE },
    };

    // === Insert ke Google Calendar ===
    const result = await calendar.events.insert({
      calendarId,
      resource: eventResource,
    });

    const created = result.data;
    const eventId = created.id;
    console.log("✅ Google Event Created:", eventId);

    // === Insert mapping ke Supabase ===
    const { data, error } = await supabase.from("reminder_events").insert([
      {
        user_email,
        event_id: eventId,
        summary,
        start: created.start?.dateTime || created.start?.date,
        end: created.end?.dateTime || created.end?.date,
        active,
        metadata: created,
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
 * POST /api/reminder/update
 */
router.post("/update", async (req, res) => {
  try {
    console.log("📩 [UPDATE] Incoming body:", req.body);

    const {
      user_email,
      event_id,
      summary,
      description = "",
      date,
      hour,
      minute,
      durationMinutes = 15,
      calendarId = "primary",
      active = true,
    } = req.body;

    if (!user_email || !event_id) {
      return res.status(400).json({
        error: "Missing required fields (user_email, event_id)",
      });
    }

    // 1. Hapus event lama dari Google Calendar
    try {
      await calendar.events.delete({
        calendarId,
        eventId: event_id,
      });
      console.log(`🗑️ Deleted old Google event: ${event_id}`);
    } catch (err) {
      console.warn("⚠️ Event lama tidak ditemukan di Google:", err.message);
    }

    // 2. Hapus event lama dari Supabase
    await supabase
      .from("reminder_events")
      .delete()
      .eq("event_id", event_id)
      .eq("user_email", user_email);

    // 3. Kalau toggle = nonaktif → cukup hapus
    if (!active) {
      console.log("⚠️ Update request with active=false → only delete");
      return res.json({
        ok: true,
        deleted: true,
        message:
          "Reminder dimatikan. Event lama dihapus dari Google & Supabase",
      });
    }

    // 4. Buat event baru
    if (!date || hour === undefined || minute === undefined) {
      return res.status(400).json({
        error: "Missing date, hour, minute for new event creation",
      });
    }

    const { start, end } = buildDateTimes(date, hour, minute, durationMinutes);

    const eventResource = {
      summary,
      description,
      start: { dateTime: start, timeZone: TIMEZONE },
      end: { dateTime: end, timeZone: TIMEZONE },
    };

    const result = await calendar.events.insert({
      calendarId,
      resource: eventResource,
    });

    const created = result.data;
    const newEventId = created.id;
    console.log("✅ Google Event Updated (new):", newEventId);

    const { data, error } = await supabase.from("reminder_events").insert([
      {
        user_email,
        event_id: newEventId,
        summary,
        start: created.start?.dateTime || created.start?.date,
        end: created.end?.dateTime || created.end?.date,
        active,
        metadata: created,
      },
    ]);

    if (error) {
      console.error("❌ Supabase insert error:", error.message);
      return res.status(500).json({
        error: "Event updated in Google but failed to persist new mapping",
        details: error.message,
      });
    }

    return res.json({ ok: true, eventId: newEventId, created, supabase: data });
  } catch (err) {
    console.error("❌ Update event error:", err.message);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

/**
 * POST /api/reminder/delete
 */
router.post("/delete", async (req, res) => {
  try {
    console.log("📩 [DELETE] Incoming body:", req.body);

    const { user_email, event_id, calendarId = "primary" } = req.body;
    if (!user_email || !event_id) {
      return res.status(400).json({ error: "Missing user_email or event_id" });
    }

    // === Delete dari Google Calendar ===
    try {
      await calendar.events.delete({
        calendarId,
        eventId: event_id,
      });
      console.log(`🗑️ Google event deleted: ${event_id}`);
    } catch (err) {
      console.warn("⚠️ Delete event di Google gagal:", err.message);
    }

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
