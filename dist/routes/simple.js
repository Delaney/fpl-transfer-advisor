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
app.post('/', async (req, res, next) => {
    const { teamId, transfers } = req.body;
    if (!teamId) {
        res.status(400).json({ error: "Team ID is invalid" });
    }
    if (!transfers || isNaN(Number(transfers))) {
        res.status(400).json({ error: "Please enter a valid number of transfers" });
    }
    try {
        const team = await (0, analyseTeam_1.analyseTeam)(teamId, transfers);
        res.json(team);
    }
    catch (error) {
        next(error);
    }
});
exports.default = app;
