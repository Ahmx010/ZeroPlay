const express = require("express");
const teamService = require("../services/teamService");
const { validateTeam } = require("../utils/validators");

const router = express.Router();

router.get("/", (req, res) => {
    res.status(200).json(teamService.getAllTeams());
});

router.get("/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Invalid team id" });
    }

    const team = teamService.getTeamById(id);

    if (!team) {
        return res.status(404).json({ error: "Team not found" });
    }

    return res.json(team);
});

router.post("/", (req, res) => {
    const error = validateTeam(req.body);

    if (error) {
        return res.status(400).json({ error });
    }

    const newTeam = teamService.createTeam(req.body);

    return res.status(201).json(newTeam);
});

module.exports = router;
