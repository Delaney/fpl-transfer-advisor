"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAndStoreFPLData = fetchAndStoreFPLData;
exports.getTopTransferRecommendations = getTopTransferRecommendations;
exports.getRecommendationData = getRecommendationData;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const index_1 = __importDefault(require("@config/index"));
const fetchFPLData_1 = require("../../utils/fetchFPLData");
const dynamo = new client_dynamodb_1.DynamoDBClient({
    region: index_1.default.awsRegion,
});
const tableName = "FPLPlayers";
const primaryKey = "playerId";
async function fetchAndStoreFPLData() {
    const res = await fetch(`${index_1.default.fplBaseURL}/bootstrap-static/`);
    const data = await res.json();
    const now = Math.floor(Date.now() / 1000);
    const nextGW = data.events
        .filter(gw => gw.deadline_time_epoch > now)
        .sort((a, b) => a.deadline_time_epoch - b.deadline_time_epoch)[0]?.id;
    if (!nextGW) {
        throw new Error("No upcoming gameweek.");
    }
    const res2 = await fetch(`${index_1.default.fplBaseURL}/fixtures/?event=${nextGW}`);
    const fixtures = await res2.json();
    for (const player of data.elements) {
        const nextGWFixture = fixtures.find(f => [f.team_a, f.team_h].includes(player.team_code));
        const difficulty = nextGWFixture ?
            nextGWFixture.team_h === player.team_code ?
                nextGWFixture.team_a_difficulty : nextGWFixture.team_h_difficulty :
            0;
        const command = new client_dynamodb_1.PutItemCommand({
            TableName: "FPLPlayers",
            Item: {
                playerId: { N: player.id.toString() },
                name: { S: player.web_name },
                position: { N: player.element_type.toString() },
                team: { S: player.team_code.toString() },
                points: { N: player.total_points.toString() },
                form: { N: player.form },
                nextFixtureDifficulty: { S: difficulty.toString() },
                price: { N: (player.now_cost / 10).toString() },
                chanceOfPlaying: { N: player.chance_of_playing_next_round?.toString() ?? '0' },
                selectedByPercent: { N: player.selected_by_percent.toString() },
            },
        });
        await dynamo.send(command);
    }
}
async function getTopTransferRecommendations() {
    const minFormValue = 7.0;
    const command = new client_dynamodb_1.QueryCommand({
        TableName: "FPLPlayers",
        IndexName: "form-index",
        KeyConditionExpression: "form >= :minForm",
        ExpressionAttributeValues: {
            ":minForm": { N: minFormValue.toString() },
        },
        Limit: 15,
    });
    const { Items } = await dynamo.send(command);
    return Items?.map((item) => ({
        name: item.name.S,
        position: item.position.N,
        form: item.form.N,
        price: item.price.N,
        nextFixtureDifficulty: item.nextFixtureDifficulty.N,
    }));
}
async function getRecommendationData(teamId) {
    const minFormValue = 6.0;
    const userTeam = await (0, fetchFPLData_1.getUserTeam)(teamId);
    const budget = userTeam?.bank ? userTeam.bank / 10 : 0;
    const playerIds = userTeam.picks.map(player => player.element);
    const positionCodes = [1, 2, 3, 4];
    const recommendations = [];
    const command = new client_dynamodb_1.BatchGetItemCommand({
        RequestItems: {
            [tableName]: {
                Keys: playerIds.map(id => ({
                    [primaryKey]: { N: id.toString() },
                }))
            }
        }
    });
    const { Responses } = await dynamo.send(command);
    const userPlayers = Responses?.[tableName]?.map((item) => ({
        name: item.name.S,
        position: item.position.N,
        team: item.team.S,
        form: item.form.N,
        price: item.price.N,
        nextFixtureDifficulty: item.nextFixtureDifficulty.S,
    }));
    for (const position of positionCodes) {
        const command = new client_dynamodb_1.QueryCommand({
            TableName: "FPLPlayers",
            IndexName: "position-form-index",
            KeyConditionExpression: "#position = :position AND form >= :minForm",
            ExpressionAttributeValues: {
                ":minForm": { N: minFormValue.toString() },
                ":position": { N: position.toString() },
            },
            ExpressionAttributeNames: {
                "#position": "position",
            },
            Limit: 15,
        });
        const { Items } = await dynamo.send(command);
        recommendations.push(...Items?.map((item) => ({
            name: item.name.S,
            position: item.position.N,
            team: item.team.S,
            form: item.form.N,
            price: item.price.N,
            nextFixtureDifficulty: item.nextFixtureDifficulty.S,
        })));
    }
    return {
        userPlayers,
        recommendations,
        budget,
    };
}
function getDifficulty(fixtures, teamCode) {
    const nextGWFixture = fixtures.find(f => [f.team_a, f.team_h].includes(teamCode));
    return nextGWFixture ?
        nextGWFixture.team_h === teamCode ?
            nextGWFixture.team_a_difficulty : nextGWFixture.team_h_difficulty :
        0;
}
