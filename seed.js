// Force Node to use Google's DNS resolver — fixes SRV lookup failures
// that can happen on some Windows networks/VPNs even when the OS itself
// can resolve the address fine.
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Run with: node seed.js
// Creates one section, one subject, one teacher, and 3 students for testing.

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const Section = require("./models/Section");
const Subject = require("./models/Subject");
const User = require("./models/User");

const seed = async () => {
  await connectDB();

  // Clear old data
  await Section.deleteMany();
  await Subject.deleteMany();
  await User.deleteMany();

  const section = await Section.create({ name: "CSE-A", department: "CSE", year: 3 });

  const teacher = await User.create({
    name: "Dr. Ramesh Kumar",
    email: "ramesh@college.edu",
    password: "teacher123",
    role: "teacher",
    employeeId: "EMP001",
    department: "CSE",
  });

  const subject = await Subject.create({
    name: "Data Structures",
    code: "CS201",
    section: section._id,
    teachers: [teacher._id],
  });

  const students = await User.create([
    {
      name: "Aditi Sharma",
      email: "aditi@college.edu",
      password: "student123",
      role: "student",
      srn: "PES1UG21CS001",
      idCardBarcode: "BARCODE001",
      section: section._id,
    },
    {
      name: "Rahul Verma",
      email: "rahul@college.edu",
      password: "student123",
      role: "student",
      srn: "PES1UG21CS002",
      idCardBarcode: "BARCODE002",
      section: section._id,
    },
    {
      name: "Sneha Reddy",
      email: "sneha@college.edu",
      password: "student123",
      role: "student",
      srn: "PES1UG21CS003",
      idCardBarcode: "BARCODE003",
      section: section._id,
    },
  ]);

  console.log("✅ Seed data created:");
  console.log("Teacher login -> email: ramesh@college.edu | password: teacher123");
  console.log("Student login -> SRN: PES1UG21CS001 | password: student123 (barcode: BARCODE001)");
  console.log("Section:", section.name, "| Subject:", subject.name);

  mongoose.connection.close();
};

seed();
