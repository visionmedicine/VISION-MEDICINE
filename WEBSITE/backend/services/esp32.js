// backend/services/esp32.js
import fetch from "node-fetch";

/**
 * Send reminder info ke ESP32
 * @param {string} ip ESP32 IP (contoh: http://192.168.1.50)
 * @param {object} reminder
 */
export async function sendReminderToESP32(ip, reminder) {
  try {
    const res = await fetch(`${ip}/reminder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reminder),
    });

    if (!res.ok) {
      throw new Error(`ESP32 responded with status ${res.status}`);
    }

    console.log("✅ Reminder sent to ESP32");
    return await res.json();
  } catch (err) {
    console.error("❌ Error sending to ESP32:", err.message);
    throw err;
  }
}
