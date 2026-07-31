const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { registerUser, registerTeacher, registerStudent, studentLogin, teacherLogin, updateProfile } = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/teacher/register", registerTeacher);
router.post("/student/register", registerStudent);
router.post("/student/login", studentLogin);
router.post("/teacher/login", teacherLogin);
router.put("/profile", protect, updateProfile);

module.exports = router;