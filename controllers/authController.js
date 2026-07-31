const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @desc  Register a new user (student or teacher) - typically used by admin/setup scripts
// @route POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, srn, idCardBarcode, section, employeeId, department } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      srn,
      idCardBarcode,
      section,
      employeeId,
      department,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Teacher self sign-up
// @route POST /api/auth/teacher/register
const registerTeacher = async (req, res) => {
  try {
    const { name, email, password, employeeId, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const teacher = await User.create({
      name,
      email,
      password,
      role: "teacher",
      employeeId,
      department,
    });

    res.status(201).json({
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      department: teacher.department,
      token: generateToken(teacher._id, teacher.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Student self sign-up
// @route POST /api/auth/student/register
const registerStudent = async (req, res) => {
  try {
    const { name, email, password, srn, idCardBarcode, section } = req.body;

    if (!name || !srn || !password || !section || !idCardBarcode) {
      return res.status(400).json({ message: "Name, SRN, password, section and ID barcode are required" });
    }

    const exists = await User.findOne({ $or: [{ srn }, { idCardBarcode }] });
    if (exists) {
      return res.status(400).json({ message: "An account with this SRN or ID barcode already exists" });
    }

    const student = await User.create({
      name,
      email: email || `${srn.toLowerCase()}@college.edu`,
      password,
      role: "student",
      srn,
      idCardBarcode,
      section,
    });

    res.status(201).json({
      _id: student._id,
      name: student.name,
      srn: student.srn,
      token: generateToken(student._id, student.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update the logged-in user's own profile (name, email, and role-specific fields)
// @route PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, department, employeeId, idCardBarcode, profilePicture } = req.body;

    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    // Check email uniqueness if it's being changed
    if (email && email !== user.email) {
      const exists = await User.findOne({ email, _id: { $ne: user._id } });
      if (exists) {
        return res.status(400).json({ message: "That email is already in use" });
      }
      user.email = email;
    }

    if (name) user.name = name;

    if (user.role === "teacher") {
      if (department) user.department = department;
      if (employeeId && employeeId !== user.employeeId) {
        const exists = await User.findOne({ employeeId, _id: { $ne: user._id } });
        if (exists) {
          return res.status(400).json({ message: "That employee ID is already in use" });
        }
        user.employeeId = employeeId;
      }
    }

    if (user.role === "student") {
      if (idCardBarcode && idCardBarcode !== user.idCardBarcode) {
        const exists = await User.findOne({ idCardBarcode, _id: { $ne: user._id } });
        if (exists) {
          return res.status(400).json({ message: "That ID barcode is already registered to another account" });
        }
        user.idCardBarcode = idCardBarcode;
      }
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      srn: user.srn,
      department: user.department,
      employeeId: user.employeeId,
      idCardBarcode: user.idCardBarcode,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Student login using SRN + password
// @route POST /api/auth/student/login
const studentLogin = async (req, res) => {
  try {
    const { srn, password } = req.body;

    const student = await User.findOne({ srn, role: "student" }).populate("section");
    if (!student || !(await student.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid SRN or password" });
    }

    res.json({
      _id: student._id,
      name: student.name,
      srn: student.srn,
      section: student.section,
      profilePicture: student.profilePicture,
      token: generateToken(student._id, student.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Teacher login using email + password
// @route POST /api/auth/teacher/login
const teacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const teacher = await User.findOne({ email, role: "teacher" });
    if (!teacher || !(await teacher.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      department: teacher.department,
      profilePicture: teacher.profilePicture,
      token: generateToken(teacher._id, teacher.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, registerTeacher, registerStudent, studentLogin, teacherLogin, updateProfile };