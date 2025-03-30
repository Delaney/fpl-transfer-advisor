"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFPLData = getFPLData;
exports.getUserTeam = getUserTeam;
const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';
async function getFPLData() {
    const response = await fetch(`${FPL_BASE_URL}/bootstrap-static/`);
    const data = await response.json();
    return {
        players: data.elements,
        positions: data.element_types,
        teams: data.teams,
    };
}
async function getUserTeam(teamId, userCookie) {
    const players = (await getFPLData()).players;
    const response = await fetch(`${FPL_BASE_URL}/my-team/${teamId}`, {
        headers: {
            'cookie': userCookie,
        }
    });
    if (!response.ok) {
        throw new Error("Failed to fetch user's FPL team");
    }
    const team = await response.json();
    team.picks = team.picks.map(player => {
        player.name = players.find(o => o.id === player.element)?.web_name;
        return player;
    });
    return team;
}
