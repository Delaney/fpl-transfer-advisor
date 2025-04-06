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

export default app;