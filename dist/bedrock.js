"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFPLAdvice = getFPLAdvice;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const analyseTeam_1 = require("./analyseTeam");
aws_sdk_1.default.config.update({ region: 'us-east-1' });
const bedrock = new aws_sdk_1.default.BedrockRuntime();
/**
 * Calls AWS Bedrock AI to explain transfer recommendations.
 */
async function generateTransferSuggestions(teamId, authToken) {
    const transfers = await (0, analyseTeam_1.analyseTeam)(teamId, authToken);
    const prompt = `Given these FPL transfer suggestions: ${JSON.stringify(transfers)}
    Explain why these are good moves.`;
    const params = {
        modelId: 'anthropic.claude-v2',
        body: prompt,
    };
    const response = await bedrock.invokeModel(params).promise();
    return JSON.parse(response.body).outputText;
}
/**
 * API function to get FPL advice.
 */
async function getFPLAdvice(teamId, authToken) {
    return await generateTransferSuggestions(teamId, authToken);
}
