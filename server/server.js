const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

// --- 1. Initialize Express App ---
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/user.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// --- 2. Security & Utility Middlewares ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(morgan("dev")); // Logs HTTP requests to the terminal
app.use(express.json()); // Parses incoming JSON payloads
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);

// --- 3. Health Check / Test Route ---
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Success: Protocol Zero API is live and listening.",
    timestamp: new Date().toISOString(),
  });
});

// --- 4. Database Connection & Server Initialization ---
const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is undefined in the .env file.");
    }

    console.log("Connecting to MongoDB Atlas...");

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(
      `Success: MongoDB Connected Successfully: ${conn.connection.host}`,
    );

    // Launch Express Server only after DB connection is established
    app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
      );
      console.log(`Test health endpoint: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Error: Database Connection Error:", error.message);
    process.exit(1); // Exit process with failure code
  }
};

// Start the application
startServer();
