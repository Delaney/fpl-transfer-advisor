import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: number;
    fplBaseURL: string;
    awsAccessKey: string;
    awsSecretKey: string;
    awsRegion: string;
    awsKnowledgeBaseId: string;
}

const config: Config = {
    port: Number(process.env.PORT) || 3000,
    awsAccessKey: process.env.AWS_ACCESS_KEY_ID!,
    awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY!,
    awsRegion: process.env.AWS_REGION!,
    fplBaseURL: process.env.FPL_BASE_URL!,
    awsKnowledgeBaseId: process.env.AWS_KNOWLEDGE_ID!,
}

export default config;