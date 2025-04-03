"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const fetchFPLData_1 = require("./fetchFPLData");
const analyseTeam_1 = require("./analyseTeam");
const bedrock_1 = require("./bedrock");
const dynamo_1 = require("./dynamo");
const app = (0, express_1.default)();
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 24 * 60 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        status: 429,
        error: 'You have reached your daily limit, please try again later.',
    },
});
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
app.post('/team', async (req, res, next) => {
    const { teamId, cookie } = req.body;
    if (!teamId || !cookie) {
        res.status(400).json({ error: "Team ID or cookie is invalid" });
    }
    try {
        const team = await (0, fetchFPLData_1.getUserTeam)(teamId, cookie);
        res.json(team);
    }
    catch (error) {
        next(error);
    }
});
app.post('/simple-analysis-single', async (req, res, next) => {
    const { teamId, cookie } = req.body;
    if (!teamId || !cookie) {
        res.status(400).json({ error: "Team ID or cookie is invalid" });
    }
    try {
        const team = await (0, analyseTeam_1.analyseTeam)(teamId, cookie);
        res.json(team);
    }
    catch (error) {
        next(error);
    }
});
app.post('/simple-analysis-multiple', async (req, res, next) => {
    const { teamId, cookie } = req.body;
    if (!teamId || !cookie) {
        res.status(400).json({ error: "Team ID or cookie is invalid" });
    }
    try {
        const team = await (0, analyseTeam_1.analyseTeam)(teamId, cookie, false);
        res.json(team);
    }
    catch (error) {
        next(error);
    }
});
app.post("/recommend", limiter, async (req, res, next) => {
    const { teamId, cookie } = req.body;
    if (!teamId || !cookie) {
        res.status(400).json({ error: "Team ID or cookie is invalid" });
    }
    try {
        const recommendations = await (0, bedrock_1.getFPLAdvice)(teamId, cookie);
        res.json({ recommendations });
    }
    catch (error) {
        next(error);
    }
});
app.post("/update-dynamo", async (req, res) => {
    await (0, dynamo_1.fetchAndStoreFPLData)();
    res.json({ success: true });
});
exports.default = app;
