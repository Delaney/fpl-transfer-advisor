"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const simple_1 = __importDefault(require("./routes/simple"));
const bedrock_1 = __importDefault(require("./routes/bedrock"));
const dynamo_1 = __importDefault(require("./routes/dynamo"));
const fetchFPLData_1 = require("./fetchFPLData");
const puppeteer_1 = require("./puppeteer");
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
app.use('/', bedrock_1.default);
app.use('/', dynamo_1.default);
app.use('/simple-analysis', simple_1.default);
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
app.post("/simulate-login", async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Missing required parameters.' });
    }
    try {
        const responses = await (0, puppeteer_1.simulateLogin)(username, password);
        res.json({ message: 'Login simulation complete.', responses });
    }
    catch (error) {
        next(error);
    }
});
exports.default = app;
