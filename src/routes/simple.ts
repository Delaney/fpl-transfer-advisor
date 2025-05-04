import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {analyseTeam} from "../analyseTeam";

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post('/', async (req, res, next) => {
    const { teamId, transfers } = req.body;

    if (!teamId) {
        res.status(400).json({error: "Team ID is invalid"});
    }

    if (!transfers || isNaN(Number(transfers))) {
        res.status(400).json({error: "Please enter a valid number of transfers"});
    }

    try {
        const team = await analyseTeam(teamId, transfers);
        res.json(team);
    } catch (error) {
        next(error);
    }
});

export default app;
