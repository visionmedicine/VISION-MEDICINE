// WEBSITE/backend/services/supabase.js
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE;

if (!url || !key) {
  throw new Error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in .env");
}

// Supabase client
export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Storage buckets
export const audioBucket = process.env.SUPABASE_AUDIO_BUCKET || "audio";
export const productsBucket =
  process.env.SUPABASE_PRODUCTS_BUCKET || "products";
export const howToUseBucket =
  process.env.SUPABASE_HOWTOUSE_BUCKET || "how-to-use";

/**
 * Save reminder to Supabase
 * @param {Object} reminder - { title, date, time, userId, ... }
 */
export async function saveReminder(reminder) {
  const { data, error } = await supabase
    .from("reminders")
    .insert([reminder])
    .select();

  if (error) {
    console.error("❌ Error saving reminder:", error.message);
    throw error;
  }
  return data[0];
}

/**
 * Get today’s reminders
 */
export async function getTodayReminders() {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("date", today);

  if (error) {
    console.error("❌ Error fetching reminders:", error.message);
    throw error;
  }
  return data;
}

/**
 * Get reminders by userId
 * @param {string} userId
 */
export async function getRemindersByUser(userId) {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("userId", userId)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    console.error("❌ Error fetching reminders by user:", error.message);
    throw error;
  }
  return data;
}

/**
 * Delete reminder
 * @param {string} id
 */
export async function deleteReminder(id) {
  const { error } = await supabase.from("reminders").delete().eq("id", id);

  if (error) {
    console.error("❌ Error deleting reminder:", error.message);
    throw error;
  }
  return true;
}

/**
 * Save detection to Supabase
 * @param {Object} detection - { timestamp, detections, nama_obat, kandungan, indikasi, efek_samping, dosis }
 */
export async function saveDetection(detection) {
  const { data, error } = await supabase
    .from("detections")
    .insert([detection])
    .select();

  if (error) {
    console.error("❌ Error saving detection:", error.message);
    throw error;
  }
  return data[0];
}

/**
 * Get all detections from Supabase (sorted by timestamp DESC)
 */
export async function getDetections() {
  const { data, error } = await supabase
    .from("detections")
    .select("*")
    .order("timestamp", { ascending: false });

  if (error) {
    console.error("❌ Error fetching detections:", error.message);
    throw error;
  }
  return data;
}

/**
 * Clear all detections from Supabase
 */
export async function clearDetections() {
  const { error } = await supabase.from("detections").delete();

  if (error) {
    console.error("❌ Error clearing detections:", error.message);
    throw error;
  }
  return true;
}
