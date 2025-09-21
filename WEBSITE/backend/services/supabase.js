// backend/services/supabase.js
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE;

if (!url || !key) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in .env");
}

export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Storage buckets
export const audioBucket = process.env.SUPABASE_AUDIO_BUCKET || "audio";
export const productsBucket = process.env.SUPABASE_PRODUCTS_BUCKET || "products";
export const howToUseBucket = process.env.SUPABASE_HOWTOUSE_BUCKET || "how-to-use";

/**
 * Save reminder to Supabase
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
