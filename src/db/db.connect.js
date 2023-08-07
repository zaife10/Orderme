const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  var isConnected = false;

  console.log("Connecting...");

  mongoose.set("strictQuery", false);

  await mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Connected to DB.");
      isConnected = true;
    })
    .catch(() => {
      console.log("Failed to connect to DB.");
      isConnected = false;
    });

  return isConnected;
};

module.exports = { connectDB };
