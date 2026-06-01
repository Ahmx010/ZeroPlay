const express = require("express");

const favoriteService = require("../services/favoriteService");
const { authenticate } = require("../middleware/authenticate");
const {
  validateCreateFavorite,
  validateFavoriteId,
  getFavoriteTeamId,
} = require("../utils/validators");
const { sendSuccess, sendError } = require("../utils/responses");

const router = express.Router();

router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const data = await favoriteService.getFavorites(req.user.id, req.supabase);
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, error, "Could not load favorites.");
  }
});

router.post("/", async (req, res) => {
  const validationError = validateCreateFavorite(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  try {
    const teamId = Number(getFavoriteTeamId(req.body));
    const data = await favoriteService.addFavorite(req.user.id, teamId, req.supabase);

    return sendSuccess(res, data, 201);
  } catch (error) {
    return sendError(res, error, "Could not create favorite.");
  }
});

router.delete("/:id", async (req, res) => {
  const validationError = validateFavoriteId(req.params.id);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  try {
    const data = await favoriteService.deleteFavorite(
      req.user.id,
      Number(req.params.id),
      req.supabase,
    );

    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, error, "Could not delete favorite.");
  }
});

module.exports = router;
