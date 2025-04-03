"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findBestTransfers = findBestTransfers;
exports.analyseTeam = analyseTeam;
exports.getTopTransferRecommendations = getTopTransferRecommendations;
const fetchFPLData_1 = require("./fetchFPLData");
const config_1 = __importDefault(require("./config"));
/**
 * Evaluates a player's performance score based on form, points, and fixtures.
 */
function evaluatePlayer(player) {
    return parseFloat(player.form) * 2 + player.total_points * 0.5 + parseFloat(player.expected_goals_conceded) * -1;
}
/**
 * Finds best replacements for weak players within budget and team constraints.
 */
function findBestTransfer(userTeam, allPlayers, budget) {
    let transfers = [];
    // Identify the weakest player
    let sortedTeam = userTeam.picks
        .map(pick => {
        // @ts-ignore
        let player = allPlayers.find(p => p.id === pick.element);
        return { ...player, score: evaluatePlayer(player) };
    })
        .sort((a, b) => a.score - b.score); // Sort ascending (worst first)
    let weakestPlayer = sortedTeam[0];
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
async function findBestTransfers(userTeam, allPlayers, budget, freeTransfers) {
    if (freeTransfers === 0) {
        console.log("No free transfers available.");
        return [];
    }
    const transferSuggestions = [];
    let attempts = 0;
    while (freeTransfers > 0 && attempts < 5) {
        attempts++;
        const underperformingPlayers = userTeam.picks
            .map((pick) => {
            const player = allPlayers.find(p => p.id === pick.element);
            if (!player)
                return null;
            return {
                player,
                performanceScore: evaluatePlayerPerformance(player),
            };
        })
            .filter((entry) => entry !== null)
            .sort((a, b) => a.performanceScore - b.performanceScore)
            .slice(0, freeTransfers);
        let foundValidTransfer = false;
        for (const entry of underperformingPlayers) {
            const { player } = entry;
            const possibleReplacements = getPotentialReplacements(player, allPlayers, userTeam);
            if (possibleReplacements.length > 0) {
                let replaced = false;
                for (const replacement of possibleReplacements) {
                    if (budget + player.now_cost >= replacement.now_cost) {
                        transferSuggestions.push({
                            out: player.web_name,
                            in: replacement.web_name,
                            cost: replacement.now_cost - player.now_cost,
                        });
                        budget -= replacement.now_cost - player.now_cost;
                        freeTransfers--;
                        foundValidTransfer = true;
                        replaced = true;
                        userTeam.picks = userTeam.picks.map(p => p.element === player.id ? { ...p, element: replacement.id } : p);
                        break;
                    }
                }
            }
        }
        if (!foundValidTransfer)
            break;
    }
    return transferSuggestions;
}
/**
 * Main function to analyze a team and return transfer recommendations.
 */
async function analyseTeam(teamId, cookie, single = true) {
    const { players, positions } = await (0, fetchFPLData_1.getFPLData)();
    const userTeam = await (0, fetchFPLData_1.getUserTeam)(teamId, cookie);
    const budget = userTeam.transfers.bank / 10;
    const freeTransfers = userTeam.transfers.limit;
    return single ?
        findBestTransfer(userTeam, players, budget) :
        findBestTransfers(userTeam, players, budget, freeTransfers);
}
async function getTopTransferRecommendations() {
    const res = await fetch(`${config_1.default.fplBaseURL}/bootstrap-static/`);
    const data = await res.json();
    const gameweeks = data.events;
    const now = Math.floor(Date.now() / 1000);
    const nextGW = data.events
        .filter(gw => gw.deadline_time_epoch > now) // Get only future gameweeks
        .sort((a, b) => a.deadline_time_epoch - b.deadline_time_epoch)[0];
    if (!nextGW) {
        throw new Error("No upcoming gameweek.");
    }
    const pastGameweeks = gameweeks.filter(gw => gw.deadline_time_epoch < now);
    const transferTrends = {};
    pastGameweeks.forEach(gw => {
        if (gw.most_transferred_in) {
            transferTrends[gw.most_transferred_in] =
                (transferTrends[gw.most_transferred_in] || 0) + 1;
        }
    });
    const topTransfers = Object.entries(transferTrends)
        .sort(([, a], [, b]) => b - a) // Sort by most transferred in
        .slice(0, 10) // Get top 10 transfer recommendations
        .map(([playerId]) => parseInt(playerId, 10));
    return {
        nextGameweek: nextGW.name,
        recommendedPlayers: topTransfers
    };
}
function evaluatePlayerPerformance(player) {
    const { total_points, form, now_cost, minutes } = player;
    // Normalize key metrics
    const formScore = parseFloat(form) * 10; // Convert string form to number and scale
    const valueForMoney = total_points / (now_cost / 10); // Points per million cost
    const playtimeFactor = minutes > 500 ? 1 : 0.5; // Discount if less than 500 mins played
    // Weighted scoring system
    return (total_points * 2 + formScore + valueForMoney * 5) * playtimeFactor;
}
function getPotentialReplacements(playerOut, allPlayers, userTeam) {
    const budgetAvailable = userTeam.transfers.bank + playerOut.now_cost;
    const positionId = playerOut.element_type;
    const clubCounts = {};
    userTeam.picks.forEach(pick => {
        const player = allPlayers.find(p => p.id === pick.element);
        if (player) {
            clubCounts[player.team] = (clubCounts[player.team] || 0) + 1;
        }
    });
    const candidates = allPlayers.filter(p => p.element_type === positionId &&
        p.now_cost <= budgetAvailable &&
        evaluatePlayerPerformance(p) > evaluatePlayerPerformance(playerOut) &&
        (clubCounts[p.team] ?? 0) < 3);
    // Sort candidates by best performance
    return candidates.sort((a, b) => evaluatePlayerPerformance(b) - evaluatePlayerPerformance(a));
}
