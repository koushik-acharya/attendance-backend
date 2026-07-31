const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const { validateQr, markAttendance, getReports, getMySubjects } = require("../controllers/studentController");

router.use(protect, requireRole("student"));

router.post("/session/validate", validateQr);
router.post("/session/mark", markAttendance);
router.get("/reports", getReports);
router.get("/subjects", getMySubjects);

module.exports = router;