import dotenv from 'dotenv';

dotenv.config();

interface Index {
    port: number;
    fplBaseURL: string;
    awsAccessKey: string;
    awsSecretKey: string;
    awsRegion: string;
    awsKnowledgeBaseId: string;
    awsAgentId: string;
    awsAgentAliasId: string;
    awsLlmId: string;
    awsAnthropicVersion: string;
}

const config: Index = {
    port: Number(process.env.PORT) || 3000,
    awsAccessKey: process.env.AWS_ACCESS_KEY_ID!,
    awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY!,
    awsRegion: process.env.AWS_REGION!,
    fplBaseURL: process.env.FPL_BASE_URL!,
    awsKnowledgeBaseId: process.env.AWS_KNOWLEDGE_BASE_ID!,
    awsAgentId: process.env.AWS_AGENT_ID!,
    awsAgentAliasId: process.env.AWS_AGENT_ALIAS_ID!,
    awsLlmId: process.env.AWS_LLM_ID!,
    awsAnthropicVersion: process.env.AWS_LLM_ANTHROPIC_VERSION!,
}

export default config;
