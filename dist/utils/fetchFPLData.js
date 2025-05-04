"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFPLData = getFPLData;
exports.getUserTeam = getUserTeam;
const index_1 = __importDefault(require("@config/index"));
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
async function getUserTeam(teamId) {
    const players = (await getFPLData()).players;
    const res = await fetch(`${index_1.default.fplBaseURL}/bootstrap-static/`);
    const data = await res.json();
    const now = Math.floor(Date.now() / 1000);
    const lastGW = data.events
        .filter(gw => gw.deadline_time_epoch <= now)
        .sort((a, b) => b.deadline_time_epoch - a.deadline_time_epoch)[0]?.id;
    if (!lastGW) {
        throw new Error("No upcoming gameweek.");
    }
    const response = await fetch(`${FPL_BASE_URL}/entry/${teamId}/event/${lastGW}/picks`);
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
