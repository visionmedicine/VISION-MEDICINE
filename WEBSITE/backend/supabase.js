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

export const audioBucket = process.env.SUPABASE_AUDIO_BUCKET || "audio";
export const productsBucket =
  process.env.SUPABASE_PRODUCTS_BUCKET || "products";
