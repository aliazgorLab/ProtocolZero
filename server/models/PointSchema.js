const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Point"],
    default: "Point",
  },
  coordinates: {
    type: [Number], // Array structure: [longitude, latitude]
    required: true,
    validate: {
      validator: function (val) {
        return val && val.length === 2;
      },
      message: "Coordinates must contain exactly [longitude, latitude].",
    },
  },
});

module.exports = pointSchema;
