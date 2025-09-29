// backend/routes/medicines.js
import express from "express";
import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// __dirname replacement di ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Google Auth
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../config/credentials.json"), // service account key
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

// Ambil dari .env
const SPREADSHEET_ID = process.env.SHEET_ID;

// ✅ GET /api/medicines
router.get("/", async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "'100 Obat'!B3:F",
      // Kolom B = Nama Obat
      // Kolom C = Kandungan
      // Kolom D = Indikasi
      // Kolom E = Efek Samping
      // Kolom F = Dosis Pemakaian
      // Kolom G = Golongan Obat
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(200).json([]);
    }

    const medicines = rows.map((row) => ({
      name: row[0] || "", // Kolom B
      kandungan: row[1] || "", // Kolom C
      indikasi: row[2] || "", // Kolom D
      efekSamping: row[3] || "", // Kolom E
      dosis: row[4] || "", // Kolom F
      golongan: row[5] || "", // Kolom G
    }));

    res.json(medicines);
  } catch (error) {
    console.error("❌ Error fetch medicines:", error);
    res
      .status(500)
      .json({ error: "Gagal mengambil data obat dari Google Sheets" });
  }
});

// ✅ Debug route: cek nama semua sheet
router.get("/sheets", async (req, res) => {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetNames = response.data.sheets.map((s) => s.properties.title);
    res.json(sheetNames);
  } catch (error) {
    console.error("❌ Error ambil nama sheets:", error);
    res.status(500).json({ error: "Gagal ambil nama sheet" });
  }
});

export default router;
