const express = require("express");
const router = express.Router();

const apiService = require("../services/apiService");

// GET /external/games
router.get("/games", async (req, res) => {

  const { league, team } = req.query;

  const games = await apiService.getLeagueGames(league);

  let filtered = games;

  if (team) {
    filtered = games.filter(
      (g) =>
        g.homeTeam?.toLowerCase().includes(team.toLowerCase()) ||
        g.awayTeam?.toLowerCase().includes(team.toLowerCase())
    );
  }

  res.json({
    success: true,
    count: filtered.length,
    data: filtered,
  });

});

module.exports = router;