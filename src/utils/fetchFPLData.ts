import {Main, FPLTeam, Player, PLTeam, Position} from 'types';
import config from "@config/index";

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

export async function getFPLData(): Promise<{
    players: Player[],
    positions: Position[],
    teams: PLTeam[],
}> {
    const response = await fetch(`${FPL_BASE_URL}/bootstrap-static/`);
    const data = await response.json() as Main;

    return {
        players: data.elements as Player[],
        positions: data.element_types as Position[],
        teams: data.teams as PLTeam[],
    };
}

export async function getUserTeam(teamId: number): Promise<FPLTeam> {
    const players = (await getFPLData()).players;
    const res = await fetch(`${config.fplBaseURL}/bootstrap-static/`);
    const data = await res.json() as Main;

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

    const team = await response.json() as FPLTeam;

    team.picks = team.picks.map(player => {
        player.name = players.find(o => o.id === player.element)?.web_name;
        return player;
    });

    return team;
}
