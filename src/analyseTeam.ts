import {getFPLData, getUserTeam} from './fetchFPLData';
import {FPLTeam, Player, TransferSuggestion} from "./types";

/**
 * Evaluates a player's performance score based on form, points, and fixtures.
 */
function evaluatePlayer(player: Player): number {
    return parseFloat(player.form) * 2 + player.total_points * 0.5 + parseFloat(player.expected_goals_conceded) * -1;
}

/**
 * Finds best replacements for weak players within budget and team constraints.
 */
function findBestTransfer(userTeam: FPLTeam, allPlayers: Player[], budget: number): TransferSuggestion[] {
    let transfers = [];

    // Identify the weakest player
    let sortedTeam = userTeam.picks
        .map(pick => {
            // @ts-ignore
            let player: Player = allPlayers.find(p => p.id === pick.element);
            return { ...player, score: evaluatePlayer(player) };
        })
        .sort((a, b) => a.score - b.score); // Sort ascending (worst first)

    let weakestPlayer: Player = sortedTeam[0];

    // Find the best available replacement
    let candidates = allPlayers
        .filter(p => p.element_type === weakestPlayer.element_type) // Same position
        .filter(p => p.now_cost <= weakestPlayer.now_cost + budget) // Within budget
        .sort((a, b) => evaluatePlayer(b) - evaluatePlayer(a));

    if (candidates.length > 0) {
        transfers.push({
            out: weakestPlayer.web_name,
            in: candidates[0].web_name,
            cost: candidates[0].now_cost - weakestPlayer.now_cost
        });
    }

    return transfers;
}

/**
 * Main function to analyze a team and return transfer recommendations.
 */
export async function analyseTeam(teamId: number, cookie: string) {
    const { players, positions } = await getFPLData();
    const userTeam = await getUserTeam(teamId, cookie);

    const budget = userTeam.transfers.bank / 10;
    const freeTransfers = userTeam.transfers.limit;
    return findBestTransfer(userTeam, players, budget);
}
