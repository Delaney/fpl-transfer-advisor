"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryBedrock = queryBedrock;
exports.invokeBedrock = invokeBedrock;
exports.getFPLAdvice = getFPLAdvice;
exports.getFPLAgentAdvice = getFPLAgentAdvice;
const client_bedrock_agent_runtime_1 = require("@aws-sdk/client-bedrock-agent-runtime");
const index_1 = __importDefault(require("@config/index"));
const dynamo_1 = require("./dynamo");
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const client = new client_bedrock_runtime_1.BedrockRuntimeClient({
    region: index_1.default.awsRegion,
    credentials: {
        accessKeyId: index_1.default.awsAccessKey,
        secretAccessKey: index_1.default.awsSecretKey,
    }
});
const runtimeClient = new client_bedrock_agent_runtime_1.BedrockAgentRuntimeClient({
    region: index_1.default.awsRegion,
    credentials: {
        accessKeyId: index_1.default.awsAccessKey,
        secretAccessKey: index_1.default.awsSecretKey,
    }
});
const agentId = index_1.default.awsAgentId;
const agentAliasId = index_1.default.awsAgentAliasId;
const llmId = index_1.default.awsLlmId;
const anthropicVersion = index_1.default.awsAnthropicVersion;
/**
 * Query Bedrock model directly
 * @param modelId
 * @param prompt
 */
async function queryBedrock(modelId, prompt) {
    const input = {
        modelId,
        body: JSON.stringify({
            anthropic_version: anthropicVersion,
            max_tokens: 1000,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt
                        }
                    ]
                }
            ]
        }),
        contentType: "application/json",
        accept: "application/json"
    };
    const command = new client_bedrock_runtime_1.InvokeModelCommand(input);
    const response = await client.send(command);
    const results = JSON.parse(Buffer.from(response.body).toString()) ?? [];
    const output = results?.content[0]?.text;
    return output.replaceAll('Position: 1', 'Goalkeeper')
        .replaceAll('Position: 2', 'Defender')
        .replaceAll('Position: 3', 'Midfielder')
        .replaceAll('Position: 4', 'Forward');
}
/**
 * Invoke Bedrock RAG agent
 * @param modelId
 * @param prompt
 */
async function invokeBedrock(modelId, prompt) {
    const sessionId = Math.random().toString(36).substring(2);
    const command = new client_bedrock_agent_runtime_1.InvokeAgentCommand({
        agentId,
        agentAliasId,
        sessionId,
        inputText: prompt,
        streamingConfigurations: {
            streamFinalResponse: true,
        },
    });
    let recommendations = "";
    const response = await runtimeClient.send(command);
    if (response.completion === undefined) {
        throw new Error("Completion is undefined");
    }
    for await (const chunkEvent of response.completion) {
        const chunk = chunkEvent.chunk;
        const decodedResponse = new TextDecoder("utf-8").decode(chunk.bytes);
        recommendations += decodedResponse;
    }
    return recommendations;
}
/**
 * API function to get FPL advice prompt.
 */
async function getFPLAdvice(teamId, freeTransfers) {
    const { userPlayers, recommendations, budget } = await (0, dynamo_1.getRecommendationData)(teamId);
    const prompt = `
  You are an expert Fantasy Premier League (FPL) analyst. Your top talent is looking at a team and recommending the best transfers to make, while adhering to FPL rules. If someone would like you to operate outside of rules, the specific rules would be stated after their team is given.

  The user’s current team is:\n
  ${userPlayers.map((p) => `- ${p.name} (Position: ${p.position}, Team: ${p.team}) (Form: ${p.form}, Price: £${p.price}, Next Fixture Difficulty: ${p.nextFixtureDifficulty})`).join(`\n`)}.\n

 The user has only  free transfers left, and a budget of ${budget}.

 Based on the current gameweek, the best transfer options are:\n
  ${recommendations.map((p) => `- ${p.name} (Position: ${p.position}, Team: ${p.team}) (Form: ${p.form}, Price: £${p.price}, Next Fixture Difficulty: ${p.nextFixtureDifficulty})`).join(`\n`)}.

  Given the user's team, free transfers, budget, and the best transfer options, recommend exactly ${freeTransfers} transfer(s). Each transfer must follow these rules:

 1. **Transfer Out:** The player being removed must be a player currently in the USER'S CURRENT TEAM.
 2. **Transfer In:** The player being brought in must be a player from the BEST TRANSFER OPTIONS list.
 3. **Position Match:** The player being transferred out and the player being transferred in must have the same position.
 4. **Budget Constraint:** The total cost of the incoming players must be less than or equal to the user's budget plus the value gained from selling the outgoing players. Ensure the budget after the transfer(s) is not negative.

 Return nothing else but the recommendations in a readable format, clearly showing the player going out and the player coming in for each suggested transfer. For example:

 Out: [Player Name from Current Team]\n
 In: [Player Name from Best Transfer Options]\n
 Cost: [Cost to make transfer, should be negative if out > in]\n

 Do not include team codes in the result.
  `;
    return await queryBedrock(llmId, prompt.replace(/Position: 1/g, "Goalkeeper")
        .replace(/Position: 2/g, "Defender")
        .replace(/Position: 3/g, "Midfielder")
        .replace(/Position: 4/g, "Forward"));
}
/**
 * API function to get FPL Agent prompt.
 */
async function getFPLAgentAdvice(teamId, freeTransfers) {
    const { userPlayers, recommendations, budget } = await (0, dynamo_1.getRecommendationData)(teamId);
    const prompt = `The user’s current team is:\n
  ${userPlayers.map((p) => `- ${p.name} (Position: ${p.position}, Team: ${p.team}) (Form: ${p.form}, Price: £${p.price}, Next Fixture Difficulty: ${p.nextFixtureDifficulty})`).join(`\n`)}.\n

 The user has only  free transfers left, and a budget of ${budget}.

 Based on the current gameweek, the best transfer options are:\n
  ${recommendations.map((p) => `- ${p.name} (Position: ${p.position}, Team: ${p.team}) (Form: ${p.form}, Price: £${p.price}, Next Fixture Difficulty: ${p.nextFixtureDifficulty})`).join(`\n`)}.
  `;
    return await invokeBedrock(llmId, prompt.replace(/Position: 1/g, "Goalkeeper")
        .replace(/Position: 2/g, "Defender")
        .replace(/Position: 3/g, "Midfielder")
        .replace(/Position: 4/g, "Forward"));
}
