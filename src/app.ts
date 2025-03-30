import express from 'express';
import bodyParser from 'body-parser';
import { getUserTeam } from "./fetchFPLData";
import {analyseTeam} from "./analyseTeam";

const app = express();

app.use(bodyParser.json());

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

app.post('/simple-analysis', async (req, res, next) => {
    const { teamId, cookie } = req.body;

    if (!teamId || !cookie) {
        res.status(400).json({error: "Team ID or cookie is invalid"});
    }

    try {
        const team = await analyseTeam(teamId, cookie);
        res.json(team);
    } catch (error) {
        next(error);
    }
});

export default app;
