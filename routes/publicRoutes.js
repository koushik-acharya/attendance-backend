const express = require("express");
const router = express.Router();
const { getPublicSections } = require("../controllers/teacherController");

router.get("/sections", getPublicSections);

module.exports = router;