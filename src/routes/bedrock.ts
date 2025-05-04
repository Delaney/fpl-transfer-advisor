import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import {getFPLAdvice} from "../bedrock";

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

app.post("/recommend", limiter, async (req, res, next) => {
    const { teamId, transfers } = req.body;

    if (!teamId) {
        res.status(400).json({error: "Team ID or cookie is invalid"});
    }

    if (!transfers || isNaN(Number(transfers))) {
        res.status(400).json({error: "Please enter a valid number of transfers"});
    }

    try {
        const recommendations = await getFPLAdvice(teamId, transfers);
        res.json({ recommendations });
    } catch (error) {
        next(error);
    }
});

export default app;
