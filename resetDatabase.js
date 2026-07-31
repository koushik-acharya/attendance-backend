// Run with: node resetDatabase.js
// WARNING: This permanently deletes ALL users, sections, subjects, and
// attendance records. Use this when you want the app to start completely
// fresh (e.g. before sharing with friends so they register real accounts).

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const User = require("./models/User");
const Section = require("./models/Section");
const Subject = require("./models/Subject");
const AttendanceSession = require("./models/AttendanceSession");

const run = async () => {
  await connectDB();

  const userCount = await User.countDocuments();
  const sectionCount = await Section.countDocuments();
  const subjectCount = await Subject.countDocuments();
  const sessionCount = await AttendanceSession.countDocuments();

  console.log("About to delete:");
  console.log(`  ${userCount} users (teachers + students)`);
  console.log(`  ${sectionCount} sections`);
  console.log(`  ${subjectCount} subjects`);
  console.log(`  ${sessionCount} attendance sessions`);
  console.log("");

  await User.deleteMany({});
  await Section.deleteMany({});
  await Subject.deleteMany({});
  await AttendanceSession.deleteMany({});

  console.log("✅ Database wiped clean. The app is ready for fresh sign-ups.");

  mongoose.connection.close();
};

run();