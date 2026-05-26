const express = require("express");
const crypto = require("crypto");

const router = express.Router();

// POST /security/hash
router.post("/hash", (req, res) => {
  const { data } = req.body || {};

  if (typeof data !== "string" || data.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Missing data",
    });
  }

  const hash = crypto
    .createHash("sha256")
    .update(data, "utf8")
    .digest("hex");

  return res.json({
    success: true,
    data,
    hash,
  });
});

// POST /security/verify
router.post("/verify", (req, res) => {
  const { data, hash } = req.body || {};

  if (typeof data !== "string" || data.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Missing data",
    });
  }

  if (typeof hash !== "string" || hash.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Missing hash",
    });
  }

  const expectedHash = crypto
    .createHash("sha256")
    .update(data, "utf8")
    .digest("hex");

  return res.json({
    success: true,
    data,
    hash,
    valid: expectedHash === hash.toLowerCase(),
  });
});

module.exports = router;