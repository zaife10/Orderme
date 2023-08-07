const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    firebaseId: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    restaurant: {
      type: Array,
      default: [],
    },
    order: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Admin", AdminSchema);
