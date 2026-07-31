const AttendanceSession = require("../models/AttendanceSession");
const User = require("../models/User");

// @desc Validate scanned QR token, returns session info if valid so app can open barcode scanner
// @route POST /api/student/session/validate
const validateQr = async (req, res) => {
  try {
    const { qrToken } = req.body;
    const studentId = req.user._id;

    const session = await AttendanceSession.findOne({ qrToken, status: "active" })
      .populate("subject", "name code")
      .populate("section", "name");

    if (!session) {
      return res.status(400).json({ message: "Invalid or expired QR code" });
    }
    if (new Date() > session.qrExpiresAt) {
      return res.status(400).json({ message: "QR code has expired" });
    }

    const student = await User.findById(studentId);
    if (String(student.section) !== String(session.section._id)) {
      return res.status(403).json({ message: "This session is not for your section" });
    }

    const alreadyMarked = session.presentStudents.some(
      (p) => String(p.student) === String(studentId)
    );
    if (alreadyMarked) {
      return res.status(400).json({ message: "Attendance already marked for this session" });
    }

    res.json({
      sessionId: session._id,
      subject: session.subject,
      section: session.section,
      message: "QR verified. Please scan your ID card barcode.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Mark attendance after scanning ID card barcode
// @route POST /api/student/session/mark
const markAttendance = async (req, res) => {
  try {
    const { sessionId, barcodeValue } = req.body;
    const studentId = req.user._id;

    const session = await AttendanceSession.findById(sessionId);
    if (!session || session.status !== "active") {
      return res.status(400).json({ message: "Session is not active" });
    }

    const student = await User.findById(studentId);
    if (student.idCardBarcode !== barcodeValue) {
      return res.status(400).json({ message: "Barcode does not match your ID card" });
    }

    const alreadyMarked = session.presentStudents.some(
      (p) => String(p.student) === String(studentId)
    );
    if (alreadyMarked) {
      return res.status(400).json({ message: "Attendance already marked" });
    }

    session.presentStudents.push({ student: studentId, barcodeUsed: barcodeValue });
    await session.save();

    // Push live update to teacher's dashboard instantly
    const io = req.app.get("io");
    io.to(`session-${sessionId}`).emit("attendance-marked", {
      sessionId,
      student: { _id: student._id, name: student.name, srn: student.srn, profilePicture: student.profilePicture },
      presentCount: session.presentStudents.length,
      totalStudentsInSection: session.totalStudentsInSection,
      scannedAt: new Date(),
    });

    res.json({ message: "Attendance marked successfully", sessionId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get subjects for the logged-in student's own section
// @route GET /api/student/subjects
const getMySubjects = async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    const Subject = require("../models/Subject");
    const subjects = await Subject.find({ section: student.section });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get student's attendance reports (daily / weekly / monthly / sem), optionally filtered to one subject
// @route GET /api/student/reports?range=daily|weekly|monthly|sem&subjectId=<id>
const getReports = async (req, res) => {
  try {
    const studentId = req.user._id;
    const student = await User.findById(studentId);
    const range = req.query.range || "monthly";
    const subjectId = req.query.subjectId || null;

    let fromDate = null;
    if (range === "daily") {
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 1);
    } else if (range === "weekly") {
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
    } else if (range === "monthly") {
      fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - 1);
    }

    const query = {
      section: student.section,
      status: "ended",
    };
    if (fromDate) query.startTime = { $gte: fromDate };
    if (subjectId) query.subject = subjectId;

    const sessions = await AttendanceSession.find(query)
      .populate("subject", "name code")
      .sort({ startTime: -1 });

    const totalSessions = sessions.length;
    let attendedSessions = 0;

    const details = sessions.map((s) => {
      const present = s.presentStudents.some((p) => String(p.student) === String(studentId));
      if (present) attendedSessions++;
      return {
        sessionId: s._id,
        subject: s.subject.name,
        date: s.startTime,
        present,
      };
    });

    const percentage = totalSessions > 0 ? Number(((attendedSessions / totalSessions) * 100).toFixed(2)) : 0;

    res.json({
      range,
      subjectId,
      totalSessions,
      attendedSessions,
      attendancePercentage: percentage,
      details,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { validateQr, markAttendance, getReports, getMySubjects };