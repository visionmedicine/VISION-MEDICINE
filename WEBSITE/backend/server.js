const express = require("express");
const cors = require("cors");
require("dotenv").config();

const mapsRoute = require("./routes/maps");
const bellRoute = require("./routes/bell");
const guideRoute = require("./routes/direction");

const app = express();
app.use(cors());
app.use(express.json());

// routes
app.use("/api/maps", mapsRoute);
app.use("/api/bell", bellRoute);
app.use("/api/direction", guideRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend jalan di port ${PORT}`));
