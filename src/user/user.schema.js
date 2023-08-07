const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
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
    cart: {
      type: Array,
      default: [],
    },
    order: {
      type: Array,
      default: [],
    },
    history: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("User", UserSchema);
