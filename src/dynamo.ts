import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import config from "./config";
import {Fixture, Main, Player} from "./types";
import {getUserTeam} from "./fetchFPLData";

const dynamo = new DynamoDBClient({
    region: config.awsRegion,
});

export async function fetchAndStoreFPLData() {
    const res = await fetch(`${config.fplBaseURL}/bootstrap-static/`);
    const data = await res.json() as Main;

    const now = Math.floor(Date.now() / 1000);
    const nextGW = data.events
        .filter(gw => gw.deadline_time_epoch > now)
        .sort((a, b) => a.deadline_time_epoch - b.deadline_time_epoch)[0]?.id;

    if (!nextGW) {
        throw new Error("No upcoming gameweek.");
    }

    const res2 = await fetch(`${config.fplBaseURL}/fixtures/?event=${nextGW}`);
    const fixtures = await res2.json() as Fixture[];

    for (const player of data.elements as Player[]) {
        const nextGWFixture = fixtures.find(f => [f.team_a, f.team_h].includes(player.team_code))!;
        const difficulty = nextGWFixture ?
            nextGWFixture.team_h === player.team_code ?
                nextGWFixture.team_a_difficulty : nextGWFixture.team_h_difficulty :
            0;

        const command = new PutItemCommand({
            TableName: "FPLPlayers",
            Item: {
                playerId: {S: player.id.toString()},
                name: {S: player.web_name},
                position: {S: player.element_type.toString()},
                team: {S: player.team_code.toString()},
                points: {N: player.total_points.toString()},
                form: {S: player.form},
                nextFixtureDifficulty: {S: difficulty.toString()},
                price: {N: (player.now_cost / 10).toString()},
                chanceOfPlaying: {N: player.chance_of_playing_next_round?.toString() ?? '0'},
                selectedByPercent: {N: player.selected_by_percent.toString()},
            },
        });

        await dynamo.send(command);
    }
}

export async function getTopTransferRecommendations() {
    const minFormValue = 7.0;

    const command = new QueryCommand({
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
        name: item.name.S!,
        position: item.position.N!,
        form: item.form.N!,
        price: item.price.N!,
        nextFixtureDifficulty: item.nextFixtureDifficulty.N!,
    }));
}

export async function getRecommendationData(teamId: number, cookie: string) {
    const minFormValue = 7.0;

    const res = await fetch(`${config.fplBaseURL}/bootstrap-static/`);
    const data = await res.json() as Main;

    const now = Math.floor(Date.now() / 1000);
    const nextGW = data.events
        .filter(gw => gw.deadline_time_epoch > now)
        .sort((a, b) => a.deadline_time_epoch - b.deadline_time_epoch)[0]?.id;

    if (!nextGW) {
        throw new Error("No upcoming gameweek.");
    }

    const res2 = await fetch(`${config.fplBaseURL}/fixtures/?event=${nextGW}`);
    const fixtures = await res2.json() as Fixture[];

    const userTeam = await getUserTeam(teamId, cookie);

    const freeTransfers = userTeam.transfers.limit;
    const budget = userTeam.transfers.bank / 10;

    const userPlayers = data.elements
        .filter(player => userTeam.picks.map(up => up.element).includes(player.id))
        .map(player => {
            const difficulty = getDifficulty(fixtures, player.team_code);
            return `${player.web_name} (Position: ${player.element_type}) (Form: ${player.form}, Price: £${player.now_cost / 10}, Next Fixture Difficulty: ${difficulty})`
        })
        .join('\n');

    return {
        userPlayers,
        recommendations: data.elements
            .filter(player => Number(player.form) >= minFormValue && player.element_type !== 5) // No managers yet
            .map((player) => {
                const difficulty = getDifficulty(fixtures, player.team_code);

                return {
                    name: player.web_name,
                    position: player.element_type.toString(),
                    form: player.form,
                    price: (player.now_cost / 10).toString(),
                    nextFixtureDifficulty: difficulty.toString(),
                }
            }),
        freeTransfers,
        budget,
    }

    // const command = new QueryCommand({
    //     TableName: "FPLPlayers",
    //     IndexName: "form-index",
    //     KeyConditionExpression: "form >= :minForm",
    //     ExpressionAttributeValues: {
    //         ":minForm": { N: minFormValue.toString() },
    //     },
    //     Limit: 15,
    // });
    //
    // const { Items } = await dynamo.send(command);
    // return Items?.map((item) => ({
    //     name: item.name.S!,
    //     position: item.position.N!,
    //     form: item.form.N!,
    //     price: item.price.N!,
    //     nextFixtureDifficulty: item.nextFixtureDifficulty.N!,
    // }));
}

function getDifficulty(fixtures: Fixture[], teamCode: number) {
    const nextGWFixture = fixtures.find(f => [f.team_a, f.team_h].includes(teamCode))!;
    return nextGWFixture ?
        nextGWFixture.team_h === teamCode ?
            nextGWFixture.team_a_difficulty : nextGWFixture.team_h_difficulty :
        0;
}