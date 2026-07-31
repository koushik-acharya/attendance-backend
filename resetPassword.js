// Run with: node resetPassword.js
// Resets a specific user's password correctly (properly hashed).

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");

const SRN_TO_RESET = "25SUUBECS0551"; // change this to your actual SRN if different
const NEW_PASSWORD = "student123"; // change this to whatever you want

const run = async () => {
  await connectDB();

  const user = await User.findOne({ srn: SRN_TO_RESET });
  if (!user) {
    console.log("No user found with that SRN.");
    mongoose.connection.close();
    return;
  }

  user.password = NEW_PASSWORD; // the model's pre-save hook will hash this automatically
  await user.save();

  console.log(`Password reset for ${user.name} (${user.srn}). New password: ${NEW_PASSWORD}`);
  mongoose.connection.close();
};

run();