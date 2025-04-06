import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {analyseTeam} from "../analyseTeam";

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post('/single', async (req, res, next) => {
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

app.post('/multiple', async (req, res, next) => {
    const { teamId, cookie } = req.body;

    if (!teamId || !cookie) {
        res.status(400).json({error: "Team ID or cookie is invalid"});
    }

    try {
        const team = await analyseTeam(teamId, cookie, false);
        res.json(team);
    } catch (error) {
        next(error);
    }
});

export default app;