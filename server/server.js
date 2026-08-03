const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

// --- 1. Initialize Express App ---
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const reportRoutes = require("./routes/report.routes");
const userRoutes = require("./routes/user.routes");
const notificationRoutes = require("./routes/notification.routes");
const resourceRoutes = require("./routes/resource.routes");
const { initializeSocket } = require("./socket");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const sanitize = require("./middleware/sanitize");

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "50mb" })); // Parses incoming JSON payloads up to 50mb
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(sanitize); // Sanitize inputs globally
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/resources", resourceRoutes);

// Attach Socket.io to the shared HTTP server so real-time events can reuse the same port.
const io = initializeSocket(server);
app.set("io", io);

// --- 3. Health Check / Test Route ---
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Success: Protocol Zero API is live and listening.",
    timestamp: new Date().toISOString(),
  });
});

// --- 4. Fallback Error Handler ---
app.use((err, req, res, next) => {
  console.error("[ERROR] Uncaught Exception:", err.stack);
  res.status(500).json({ success: false, message: "Internal server error." });
});

// --- 5. Database Connection & Server Initialization ---
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
    server.listen(PORT, () => {
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
