// backend/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";

// Import routes
import bellRoutes from "./routes/bell.js";
import chatRoutes from "./routes/chat.js";
import directionRoutes from "./routes/direction.js";
import mapsRoutes from "./routes/maps.js";
import medicinesRoutes from "./routes/medicines.js";
import productsRoutes from "./routes/products.js";
import howToUseRoutes from "./routes/how-to-use.js";
import livestreamRoutes from "./routes/livestream.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
  })
);
app.use(express.json());

// API routes
app.use("/api/bell", bellRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/direction", directionRoutes);
app.use("/api/maps", mapsRoutes);
app.use("/api/medicines", medicinesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/how-to-use", howToUseRoutes);
app.use("/api/livestream", livestreamRoutes);

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
