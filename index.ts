import app from './src/app';
import config from './src/config';
import express from "express";

init();

async function init() {
    app.use((
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
    ) => {
        console.error('Unhandled error:', err);
        res.status(500).json({ error: 'Something went wrong!' });
    });

    app.listen(config.port, () => {
        console.log('Express App Listening on port ' + config.port);
    });

    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
}
