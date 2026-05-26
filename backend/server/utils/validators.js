function validateTeam(team) {
    if (!team || typeof team !== "object") {
        return "Team data is required";
    }

    if (typeof team.name !== "string" || team.name.trim().length === 0) {
        return "Team name is required";
    }

    if (typeof team.sport !== "string" || team.sport.trim().length === 0) {
        return "Sport is required";
    }

    if (team.city !== undefined && typeof team.city !== "string") {
        return "City must be a string";
    }

    return null;
}

module.exports = {
    validateTeam,
};
