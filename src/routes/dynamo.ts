import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {fetchAndStoreFPLData} from "@services/aws/dynamo";

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post("/update-dynamo", async (req, res) => {
    await fetchAndStoreFPLData();
    res.json({ success: true });
});

export default app;
