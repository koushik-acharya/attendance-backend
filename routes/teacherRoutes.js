const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const {
  getSections,
  getSubjects,
  startSession,
  getSessionStatus,
  endSession,
  createSection,
  createSubject,
  getClassAnalytics,
  getStudentHistory,
} = require("../controllers/teacherController");

router.use(protect, requireRole("teacher"));

router.get("/sections", getSections);
router.post("/sections", createSection);
router.get("/subjects/:sectionId", getSubjects);
router.post("/subjects", createSubject);
router.get("/analytics/:sectionId/:subjectId", getClassAnalytics);
router.get("/student-history/:subjectId/:studentId", getStudentHistory);
router.post("/session/start", startSession);
router.get("/session/:sessionId", getSessionStatus);
router.post("/session/end/:sessionId", endSession);

module.exports = router;