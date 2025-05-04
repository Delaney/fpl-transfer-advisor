import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import simpleRoutes from "./routes/simple";
import bedrockRoutes from "./routes/bedrock";
import dynamoRoutes from "./routes/dynamo";

import {getUserTeam} from "./utils/fetchFPLData";

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use('/', bedrockRoutes);
app.use('/', dynamoRoutes);
app.use('/simple-analysis', simpleRoutes);

app.post('/team', async (req, res, next) => {
    const { teamId } = req.body;

    if (!teamId) {
        res.status(400).json({error: "Team ID is invalid"});
    }

    try {
        const team = await getUserTeam(teamId);
        res.json(team);
    } catch (error) {
        next(error);
    }
});

export default app;
