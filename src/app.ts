import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';

import {getUserTeam} from "./fetchFPLData";
import {analyseTeam} from "./analyseTeam";
import {getFPLAdvice} from "./bedrock";
import {fetchAndStoreFPLData} from "./dynamo";

const app = express();

const limiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        status: 429,
        error: 'You have reached your daily limit, please try again later.',
    },
});

app.use(bodyParser.json());
app.use(cors());

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

app.post('/simple-analysis-single', async (req, res, next) => {
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

app.post('/simple-analysis-multiple', async (req, res, next) => {
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

app.post("/recommend", limiter, async (req, res, next) => {
    const { teamId, cookie } = req.body;

    if (!teamId || !cookie) {
        res.status(400).json({error: "Team ID or cookie is invalid"});
    }

    try {
        const recommendations = await getFPLAdvice(teamId, cookie);
        res.json({ recommendations });
    } catch (error) {
        next(error);
    }
});

app.post("/update-dynamo", async (req, res) => {
    await fetchAndStoreFPLData();
    res.json({ success: true });
});

export default app;
