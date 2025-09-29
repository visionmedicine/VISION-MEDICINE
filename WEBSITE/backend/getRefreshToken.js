// getRefreshToken.js
import "dotenv/config";
import { google } from "googleapis";
import readline from "readline";

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uri = process.env.GOOGLE_REDIRECT_URI;

if (!client_id || !client_secret || !redirect_uri) {
  console.error(
    "❌ Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI in .env"
  );
  process.exit(1);
}

// Setup OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uri
);

// Scopes (disesuaikan kebutuhan, contoh Calendar)
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

// Generate URL login
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

console.log("👉 Buka URL ini di browser untuk login dan authorize:\n");
console.log(authUrl, "\n");

// Setup CLI input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Ambil code dari callback
rl.question("Masukin 'code' dari URL callback: ", async (code) => {
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    console.log("\n✅ Success! Simpan refresh token berikut ke .env:");
    console.log("GOOGLE_REFRESH_TOKEN=" + tokens.refresh_token);
    rl.close();
  } catch (err) {
    console.error(
      "❌ Error exchanging code:",
      err.response?.data || err.message
    );
    rl.close();
  }
});
