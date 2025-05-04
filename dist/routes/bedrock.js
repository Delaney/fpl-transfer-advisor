"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const bedrock_1 = require("@services/aws/bedrock");
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
app.post("/recommend", limiter, async (req, res, next) => {
    const { teamId, transfers } = req.body;
    if (!teamId) {
        res.status(400).json({ error: "Team ID or cookie is invalid" });
    }
    if (!transfers || isNaN(Number(transfers))) {
        res.status(400).json({ error: "Please enter a valid number of transfers" });
    }
    try {
        const recommendations = await (0, bedrock_1.getFPLAdvice)(teamId, transfers);
        res.json({ recommendations });
    }
    catch (error) {
        next(error);
    }
});
exports.default = app;
