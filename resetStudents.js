// Run with: node resetStudents.js
// Deletes only STUDENT accounts and all attendance session records.
// Teachers, sections, and subjects are kept untouched.

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const User = require("./models/User");
const AttendanceSession = require("./models/AttendanceSession");

const run = async () => {
  await connectDB();

  const studentCount = await User.countDocuments({ role: "student" });
  const sessionCount = await AttendanceSession.countDocuments();

  console.log("About to delete:");
  console.log(`  ${studentCount} student accounts`);
  console.log(`  ${sessionCount} attendance sessions`);
  console.log("Teachers, sections, and subjects will NOT be touched.");
  console.log("");

  await User.deleteMany({ role: "student" });
  await AttendanceSession.deleteMany({});

  console.log("✅ Student data wiped. Teacher accounts kept intact.");
  console.log("Students can now sign up fresh.");

  mongoose.connection.close();
};

run();