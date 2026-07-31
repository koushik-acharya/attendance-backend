const { v4: uuidv4 } = require("uuid");
const Section = require("../models/Section");
const Subject = require("../models/Subject");
const User = require("../models/User");
const AttendanceSession = require("../models/AttendanceSession");

// @desc Get class-wide attendance analytics for a section+subject (for pie chart)
// @route GET /api/teacher/analytics/:sectionId/:subjectId
const getClassAnalytics = async (req, res) => {
  try {
    const { sectionId, subjectId } = req.params;

    const sessions = await AttendanceSession.find({
      section: sectionId,
      subject: subjectId,
      status: "ended",
    });
    const totalSessions = sessions.length;

    const students = await User.find({ role: "student", section: sectionId }).select("name srn profilePicture");

    const presentCounts = {};
    sessions.forEach((s) => {
      s.presentStudents.forEach((p) => {
        const id = String(p.student);
        presentCounts[id] = (presentCounts[id] || 0) + 1;
      });
    });

    let good = 0;
    let warning = 0;
    let critical = 0;

    const studentBreakdown = students.map((st) => {
      const present = presentCounts[String(st._id)] || 0;
      const percentage = totalSessions > 0 ? Number(((present / totalSessions) * 100).toFixed(1)) : 0;
      if (percentage >= 75) good++;
      else if (percentage >= 50) warning++;
      else critical++;
      return {
        id: st._id,
        name: st.name,
        srn: st.srn,
        profilePicture: st.profilePicture,
        present,
        percentage,
      };
    });

    studentBreakdown.sort((a, b) => a.percentage - b.percentage);

    res.json({
      totalSessions,
      totalStudents: students.length,
      good,
      warning,
      critical,
      studentBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get one student's full session-by-session attendance history for a subject
// @route GET /api/teacher/student-history/:subjectId/:studentId
const getStudentHistory = async (req, res) => {
  try {
    const { subjectId, studentId } = req.params;

    const student = await User.findById(studentId).select("name srn profilePicture");
    if (!student) return res.status(404).json({ message: "Student not found" });

    const sessions = await AttendanceSession.find({
      subject: subjectId,
      status: "ended",
    })
      .populate("subject", "name code")
      .sort({ startTime: -1 });

    const totalSessions = sessions.length;
    let attendedSessions = 0;

    const details = sessions.map((s) => {
      const present = s.presentStudents.some((p) => String(p.student) === String(studentId));
      if (present) attendedSessions++;
      return {
        sessionId: s._id,
        date: s.startTime,
        present,
      };
    });

    const percentage = totalSessions > 0 ? Number(((attendedSessions / totalSessions) * 100).toFixed(1)) : 0;

    res.json({
      student: {
        _id: student._id,
        name: student.name,
        srn: student.srn,
        profilePicture: student.profilePicture,
      },
      subjectName: sessions[0]?.subject?.name || "",
      totalSessions,
      attendedSessions,
      attendancePercentage: percentage,
      details,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all sections (public - used during student sign-up)
// @route GET /api/sections
const getPublicSections = async (req, res) => {
  const sections = await Section.find();
  res.json(sections);
};

// @desc Create a new section
// @route POST /api/teacher/sections
const createSection = async (req, res) => {
  try {
    const { name, department, year } = req.body;
    if (!name || !department || !year) {
      return res.status(400).json({ message: "Name, department and year are required" });
    }
    const exists = await Section.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: "A section with this name already exists" });
    }
    const section = await Section.create({ name, department, year });
    res.status(201).json(section);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create a new subject under a section
// @route POST /api/teacher/subjects
const createSubject = async (req, res) => {
  try {
    const { name, code, sectionId } = req.body;
    const teacherId = req.user._id;
    if (!name || !code || !sectionId) {
      return res.status(400).json({ message: "Name, code and section are required" });
    }
    const subject = await Subject.create({
      name,
      code,
      section: sectionId,
      teachers: [teacherId],
    });
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all sections
// @route GET /api/teacher/sections
const getSections = async (req, res) => {
  const sections = await Section.find();
  res.json(sections);
};

// @desc Get subjects for a section (that this teacher can teach)
// @route GET /api/teacher/subjects/:sectionId
const getSubjects = async (req, res) => {
  const subjects = await Subject.find({ section: req.params.sectionId });
  res.json(subjects);
};

// @desc Start a new attendance session -> generates QR token
// @route POST /api/teacher/session/start
const startSession = async (req, res) => {
  try {
    const { sectionId, subjectId } = req.body;
    const teacherId = req.user._id;

    const existing = await AttendanceSession.findOne({
      section: sectionId,
      subject: subjectId,
      status: "active",
    });
    if (existing) {
      return res.status(400).json({ message: "An active session already exists for this class" });
    }

    const totalStudents = await User.countDocuments({ role: "student", section: sectionId });
    const qrToken = uuidv4();
    const expirySeconds = parseInt(process.env.QR_EXPIRY_SECONDS || "300");

    const session = await AttendanceSession.create({
      teacher: teacherId,
      section: sectionId,
      subject: subjectId,
      qrToken,
      qrExpiresAt: new Date(Date.now() + expirySeconds * 1000),
      totalStudentsInSection: totalStudents,
    });

    res.status(201).json({
      sessionId: session._id,
      qrToken: session.qrToken,
      qrExpiresAt: session.qrExpiresAt,
      totalStudentsInSection: totalStudents,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get live status of an active session (poll fallback + initial load)
// @route GET /api/teacher/session/:sessionId
const getSessionStatus = async (req, res) => {
  const session = await AttendanceSession.findById(req.params.sessionId)
    .populate("presentStudents.student", "name srn profilePicture")
    .populate("section", "name")
    .populate("subject", "name code");

  if (!session) return res.status(404).json({ message: "Session not found" });
  res.json(session);
};

// @desc End an active session and calculate final attendance %
// @route POST /api/teacher/session/end/:sessionId
const endSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.status === "ended") {
      return res.status(400).json({ message: "Session already ended" });
    }

    session.status = "ended";
    session.endTime = new Date();
    session.attendancePercentage =
      session.totalStudentsInSection > 0
        ? Number(((session.presentStudents.length / session.totalStudentsInSection) * 100).toFixed(2))
        : 0;

    await session.save();

    const io = req.app.get("io");
    io.to(`session-${session._id}`).emit("session-ended", {
      sessionId: session._id,
      presentCount: session.presentStudents.length,
      totalStudentsInSection: session.totalStudentsInSection,
      attendancePercentage: session.attendancePercentage,
    });

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSections,
  getSubjects,
  startSession,
  getSessionStatus,
  endSession,
  createSection,
  createSubject,
  getPublicSections,
  getClassAnalytics,
  getStudentHistory,
};