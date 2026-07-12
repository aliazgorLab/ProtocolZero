// backend/models/PointSchema.js
const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Point"],
    default: "Point",
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: false, // Can be null/empty
    validate: { validator: (val) => val.length === 2 },
  },
});

module.exports = pointSchema; // [cite: 58, 59]
