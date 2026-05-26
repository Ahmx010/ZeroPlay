const express = require("express");
const router = express.Router();

const teamService = require("../services/teamService");

let games = [];
let nextId = 1;

// GET /games
router.get("/", (req, res) => {
  const { league, teamId } = req.query;

  let result = games;

  // filter by league
  if (league) {
    result = result.filter(
      (g) => g.league.toLowerCase() === league.toLowerCase()
    );
  }

  // filter by team (home OR away)
  if (teamId) {
    const id = Number(teamId);

    result = result.filter(
      (g) => g.homeTeamId === id || g.awayTeamId === id
    );
  }

  return res.json({
    success: true,
    count: result.length,
    data: result,
  });
});

// GET /games/:id
router.get("/:id", (req, res) => {
  const gameId = Number(req.params.id);

  if (!Number.isInteger(gameId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid game id",
    });
  }

  const game = games.find((g) => g.id === gameId);

  if (!game) {
    return res.status(404).json({
      success: false,
      message: "Game not found",
    });
  }

  return res.json({
    success: true,
    data: game,
  });
});

// POST /games
router.post("/", (req, res) => {
  const { score, date, league } = req.body;

  const homeTeamId = Number(req.body.homeTeamId);
  const awayTeamId = Number(req.body.awayTeamId);

  // basic validation
  if (
    !Number.isInteger(homeTeamId) ||
    !Number.isInteger(awayTeamId) ||
    !score ||
    !date ||
    !league
  ) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  if (homeTeamId === awayTeamId) {
    return res.status(400).json({
      success: false,
      message: "Teams must be different",
    });
  }

  // check if teams exist
  const homeTeam = teamService.getTeamById(homeTeamId);
  const awayTeam = teamService.getTeamById(awayTeamId);

  if (!homeTeam || !awayTeam) {
    return res.status(400).json({
      success: false,
      message: "Invalid team IDs",
    });
  }

  const newGame = {
    id: nextId++,
    league,
    homeTeamId,
    awayTeamId,
    score,
    date,
  };

  games.push(newGame);

  return res.status(201).json({
    success: true,
    message: "Game created successfully",
    data: newGame,
  });
});

module.exports = router;