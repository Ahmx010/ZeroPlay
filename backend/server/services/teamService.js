const { teams } = require("../data/store");

function getAllTeams() {
    return teams;
}

function getTeamById(id) {
    return teams.find((team) => team.id === id);
}

function createTeam(teamData) {
    const nextId =
        teams.length === 0 ? 1 : Math.max(...teams.map((team) => team.id)) + 1;

    const newTeam = {
        id: nextId,
        name: teamData.name.trim(),
        sport: teamData.sport.trim(),
        city: teamData.city ? teamData.city.trim() : "",
    };

    teams.push(newTeam);

    return newTeam;
}

module.exports = {
    getAllTeams,
    getTeamById,
    createTeam,
};
