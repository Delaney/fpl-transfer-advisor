"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const analyseTeam_1 = require("../analyseTeam");
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
app.post('/single', async (req, res, next) => {
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
app.post('/multiple', async (req, res, next) => {
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
