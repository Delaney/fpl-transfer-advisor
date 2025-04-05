"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokeBedrock = invokeBedrock;
exports.getFPLAdvice = getFPLAdvice;
const client_bedrock_agent_runtime_1 = require("@aws-sdk/client-bedrock-agent-runtime");
const config_1 = __importDefault(require("./config"));
const dynamo_1 = require("./dynamo");
const client = new client_bedrock_agent_runtime_1.BedrockAgentRuntimeClient({
    region: config_1.default.awsRegion,
    credentials: {
        accessKeyId: config_1.default.awsAccessKey,
        secretAccessKey: config_1.default.awsSecretKey,
    }
});
const agentId = "VICAXIAMFY";
const agentAliasId = "GKDV2MHUHJ";
async function invokeBedrock(modelId, prompt) {
    // const sessionId = Math.random().toString(36).substring(2);
    // const command = new InvokeAgentCommand({
    //     agentId,
    //     agentAliasId,
    //     sessionId,
    //     inputText: prompt,
    //     streamingConfigurations: {
    //         streamFinalResponse: true,
    //     },
    // });
    //
    // let recommendations = "";
    // const response = await client.send(command);
    //
    // if (response.completion === undefined) {
    //     throw new Error("Completion is undefined");
    // }
    //
    // for await (const chunkEvent of response.completion!) {
    //     const chunk = chunkEvent.chunk!;
    //     const decodedResponse = new TextDecoder("utf-8").decode(chunk.bytes);
    //     recommendations += decodedResponse;
    // }
    //
    // return recommendations;
    const input = {
        input: {
            text: prompt,
        },
        retrieveAndGenerateConfiguration: {
            type: client_bedrock_agent_runtime_1.RetrieveAndGenerateType.KNOWLEDGE_BASE,
            knowledgeBaseConfiguration: {
                knowledgeBaseId: config_1.default.awsKnowledgeBaseId,
                modelArn: "anthropic.claude-3-sonnet-20240229-v1:0",
                retrievalConfiguration: {
                    vectorSearchConfiguration: {
                        numberOfResults: 10,
                        overrideSearchType: client_bedrock_agent_runtime_1.SearchType.HYBRID,
                    },
                },
            },
        },
    };
    const command = new client_bedrock_agent_runtime_1.RetrieveAndGenerateCommand(input);
    const response = await client.send(command);
    return response.output?.text ?? "";
}
/**
 * API function to get FPL advice.
 */
async function getFPLAdvice(teamId, cookie) {
    const { userPlayers, recommendations, freeTransfers, budget } = await (0, dynamo_1.getRecommendationData)(teamId, cookie);
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

 Out: [Player Name from Current Team]
 In: [Player Name from Best Transfer Options]
 Cost: [Cost to make transfer, should be negative if out > in]

 Do not include team codes in the result.
  `;
    return await invokeBedrock("anthropic.claude-3-sonnet-20240229-v1:0", prompt.replace(/Position: 1/g, "Goalkeeper")
        .replace(/Position: 2/g, "Defender")
        .replace(/Position: 3/g, "Midfielder")
        .replace(/Position: 4/g, "Forward"));
}
