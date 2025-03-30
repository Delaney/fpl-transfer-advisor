import {Main, FPLTeam, Player, PLTeam, Position} from './types';

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

export async function getUserTeam(teamId: number, userCookie: string): Promise<FPLTeam> {
    const players = (await getFPLData()).players;

    const response = await fetch(`${FPL_BASE_URL}/my-team/${teamId}`, {
        headers: {
            'cookie': userCookie,
        }
    });

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