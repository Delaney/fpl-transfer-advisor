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

export async function findBestTransfers(
    userTeam: FPLTeam,
    allPlayers: Player[],
    budget: number,
    freeTransfers: number,
): Promise<TransferSuggestion[]> {
    if (freeTransfers === 0) {
        console.log("No free transfers available.");
        return [];
    }

    const transferSuggestions: TransferSuggestion[] = [];
    let attempts = 0;

    while (freeTransfers > 0 && attempts < 5) {
        attempts++;

        const underperformingPlayers = userTeam.picks
        .map((pick) => {
            const player = allPlayers.find(p => p.id === pick.element);
            if (!player) return null;
            return {
                player,
                performanceScore: evaluatePlayerPerformance(player),
            };
        })
        .filter((entry) => entry !== null)
        .sort((a, b) => a!.performanceScore - b!.performanceScore)
        .slice(0, freeTransfers);

        let foundValidTransfer = false;

        for (const entry of underperformingPlayers) {
            const { player } = entry!;
            const possibleReplacements = getPotentialReplacements(player, allPlayers, userTeam);

            if (possibleReplacements.length > 0) {
                const bestReplacement = possibleReplacements[0];

                if (budget + player.now_cost >= bestReplacement.now_cost) {
                    transferSuggestions.push({
                        out: player.web_name,
                        in: bestReplacement.web_name,
                        cost: bestReplacement.now_cost - player.now_cost,
                    });

                    budget -= bestReplacement.now_cost - player.now_cost;
                    foundValidTransfer = true;

                    userTeam.picks = userTeam.picks.map(p =>
                        p.element === player.id ? { ...p, element: bestReplacement.id } : p
                    );
                }
            }
        }

        if (!foundValidTransfer) break;
    }

    return transferSuggestions;
}

/**
 * Main function to analyze a team and return transfer recommendations.
 */
export async function analyseTeam(teamId: number, cookie: string, single: boolean = true) {
    const { players, positions } = await getFPLData();
    const userTeam = await getUserTeam(teamId, cookie);

    const budget = userTeam.transfers.bank / 10;
    const freeTransfers = userTeam.transfers.limit;
    return single ?
        findBestTransfer(userTeam, players, budget) :
        findBestTransfers(userTeam, players, budget, freeTransfers);
}

function evaluatePlayerPerformance(player: Player): number {
    const { total_points, form, now_cost, minutes } = player;

    // Normalize key metrics
    const formScore = parseFloat(form) * 10; // Convert string form to number and scale
    const valueForMoney = total_points / (now_cost / 10); // Points per million cost
    const playtimeFactor = minutes > 500 ? 1 : 0.5; // Discount if less than 500 mins played

    // Weighted scoring system
    return (total_points * 2 + formScore + valueForMoney * 5) * playtimeFactor;
}

function getPotentialReplacements(playerOut: Player, allPlayers: Player[], userTeam: FPLTeam): Player[] {
    const budgetAvailable = userTeam.transfers.bank + playerOut.now_cost;
    const positionId = playerOut.element_type;

    const clubCounts: Record<number, number> = {};
    userTeam.picks.forEach(pick => {
        const player = allPlayers.find(p => p.id === pick.element);
        if (player) {
            clubCounts[player.team] = (clubCounts[player.team] || 0) + 1;
        }
    });

    const candidates = allPlayers.filter(p =>
        p.element_type === positionId &&
        p.now_cost <= budgetAvailable &&
        evaluatePlayerPerformance(p) > evaluatePlayerPerformance(playerOut) &&
        (clubCounts[p.team] ?? 0) < 3
    );

    // Sort candidates by best performance
    return candidates.sort((a, b) => evaluatePlayerPerformance(b) - evaluatePlayerPerformance(a));
}
