const express = require("express");
const teamService = require("../services/teamService");

const router = express.Router();

function sendRouteError(res, error) {
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Team request failed",
        code: error.code,
        details: error.details,
    });
}

router.get("/", async (req, res) => {
    try {
        const teams = await teamService.getAllTeams();
        return res.status(200).json(teams);
    } catch (error) {
        return sendRouteError(res, error);
    }
});

router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Invalid team id" });
    }

    try {
        const team = await teamService.getTeamById(id);

        if (!team) {
            return res.status(404).json({ error: "Team not found" });
        }

        return res.json(team);
    } catch (error) {
        return sendRouteError(res, error);
    }
});

router.post("/", async (req, res) => {
    return res.status(405).json({
        success: false,
        message: "Manual team creation is disabled. Use GET /admin/sync-teams to synchronize teams from ESPN.",
    });
});

module.exports = router;
