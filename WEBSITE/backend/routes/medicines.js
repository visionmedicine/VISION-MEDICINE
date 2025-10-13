// backend/routes/medicines.js
import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Setup Google Auth dari env vars (service account)
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Handle multiline key
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

// Ambil dari .env
const SPREADSHEET_ID = process.env.SHEET_ID;

// ✅ GET /api/medicines
router.get("/", async (req, res) => {
  try {
    if (!SPREADSHEET_ID) {
      throw new Error("SHEET_ID tidak ditemukan di env vars");
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "'100 Obat'!B3:G", // Fix: Include G untuk golongan (B:Nama, C:Kandungan, D:Indikasi, E:Efek Samping, F:Dosis, G:Golongan)
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(200).json([]); // Empty array jika gak ada data
    }

    const medicines = rows
      .map((row) => ({
        name: row[0] || "", // Kolom B: Nama Obat
        kandungan: row[1] || "", // Kolom C: Kandungan
        indikasi: row[2] || "", // Kolom D: Indikasi
        efekSamping: row[3] || "", // Kolom E: Efek Samping
        dosis: row[4] || "", // Kolom F: Dosis
        golongan: row[5] || "", // Kolom G: Golongan Obat
      }))
      .filter((med) => med.name.trim() !== "") // Filter row kosong
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alfabetis nama

    res.json(medicines);
  } catch (error) {
    console.error("❌ Error fetch medicines:", error); // Log detail untuk debug
    res.status(500).json({
      error: "Gagal mengambil data obat dari Google Sheets",
      details: error.message, // Tambah detail untuk debug
    });
  }
});

// ✅ Debug route: cek nama semua sheet
router.get("/sheets", async (req, res) => {
  try {
    if (!SPREADSHEET_ID) {
      throw new Error("SHEET_ID tidak ditemukan di env vars");
    }

    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetNames = response.data.sheets.map((s) => s.properties.title);
    res.json({ sheets: sheetNames });
  } catch (error) {
    console.error("❌ Error ambil nama sheets:", error);
    res
      .status(500)
      .json({ error: "Gagal ambil nama sheet", details: error.message });
  }
});

export default router;
