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
const fetchFPLData_1 = require("./utils/fetchFPLData");
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
app.use('/', bedrock_1.default);
app.use('/', dynamo_1.default);
app.use('/simple-analysis', simple_1.default);
app.post('/team', async (req, res, next) => {
    const { teamId } = req.body;
    if (!teamId) {
        res.status(400).json({ error: "Team ID is invalid" });
    }
    try {
        const team = await (0, fetchFPLData_1.getUserTeam)(teamId);
        res.json(team);
    }
    catch (error) {
        next(error);
    }
});
exports.default = app;
