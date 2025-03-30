"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const fetchFPLData_1 = require("./fetchFPLData");
const analyseTeam_1 = require("./analyseTeam");
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
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
exports.default = app;
