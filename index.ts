import app from './src/app';
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

    app.listen(3001, () => {
        console.log('Express App Listening on Port 3001');
    });

    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
}
