"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    port: Number(process.env.PORT) || 3000,
    awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
    awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsRegion: process.env.AWS_REGION,
    fplBaseURL: process.env.FPL_BASE_URL,
    awsKnowledgeBaseId: process.env.AWS_KNOWLEDGE_ID,
    awsAgentId: process.env.AWS_AGENT_ID,
    awsAgentAliasId: process.env.AWS_AGENT_ALIAS_ID,
    awsLlmId: process.env.AWS_LLM_ID,
};
exports.default = config;
