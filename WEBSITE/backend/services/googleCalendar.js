// backend/services/googleCalendar.js
import { google } from "googleapis";
import fs from "fs";
import path from "path";

const KEYFILEPATH = path.join(process.cwd(), "backend/config/credentials.json");
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

// Load credentials
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const calendar = google.calendar({ version: "v3", auth });

/**
 * Create calendar event
 * @param {string} medicine
 * @param {string} date format YYYY-MM-DD
 * @param {string} hour
 * @param {string} minute
 */
export async function createCalendarEvent(medicine, date, hour, minute) {
  try {
    const startDateTime = new Date(`${date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 mins later

    const event = {
      summary: `Reminder Minum Obat: ${medicine}`,
      description: `Saatnya minum ${medicine}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: "Asia/Jakarta",
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: "Asia/Jakarta",
      },
    };

    const res = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    console.log("✅ Google Calendar event created:", res.data.htmlLink);
    return res.data;
  } catch (err) {
    console.error("❌ Error creating Google Calendar event:", err.message);
    throw err;
  }
}
