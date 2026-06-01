const express = require("express");

const authService = require("../services/authService");
const { authenticate } = require("../middleware/authenticate");
const {
  validateSignup,
  validateLogin,
  validateUpdateAccount,
} = require("../utils/validators");
const { sendSuccess, sendError } = require("../utils/responses");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const validationError = validateSignup(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  try {
    const data = await authService.signup(req.body);
    return sendSuccess(res, data, 201);
  } catch (error) {
    return sendError(res, error, "Signup failed.");
  }
});

router.post("/login", async (req, res) => {
  const validationError = validateLogin(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  try {
    const data = await authService.login(req.body);
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, error, "Login failed.");
  }
});

router.post("/logout", authenticate, async (req, res) => {
  try {
    const data = await authService.logout(req.accessToken);
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, error, "Logout failed.");
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const data = await authService.getMe({
      user: req.user,
      userClient: req.supabase,
    });

    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, error, "Could not load authenticated user.");
  }
});

router.patch("/me", authenticate, async (req, res) => {
  const validationError = validateUpdateAccount(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  try {
    const data = await authService.updateMe({
      user: req.user,
      userClient: req.supabase,
      accessToken: req.accessToken,
      updates: req.body,
    });

    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, error, "Could not update authenticated user.");
  }
});

module.exports = router;
