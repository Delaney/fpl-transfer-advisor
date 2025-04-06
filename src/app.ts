import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import simpleRoutes from "./routes/simple";
import bedrockRoutes from "./routes/bedrock";
import dynamoRoutes from "./routes/dynamo";

import {getUserTeam} from "./fetchFPLData";
import {simulateLogin} from "./puppeteer";

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use('/', bedrockRoutes);
app.use('/', dynamoRoutes);
app.use('/simple-analysis', simpleRoutes);

app.post('/team', async (req, res, next) => {
    const { teamId, cookie } = req.body;

    if (!teamId || !cookie) {
        res.status(400).json({error: "Team ID or cookie is invalid"});
    }

    try {
        const team = await getUserTeam(teamId, cookie);
        res.json(team);
    } catch (error) {
        next(error);
    }
});

app.post("/simulate-login", async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Missing required parameters.' });
    }

    try {
        const responses = await simulateLogin(
            username,
            password,
        );
        res.json({ message: 'Login simulation complete.', responses });
    } catch (error) {
        next(error)
    }
});

export default app;
