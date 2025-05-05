const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get("/", (req, res) => {
    res.send("Space Shooter Server is running!");
});

server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});

wss.on("connection", (ws) => {
    console.log("New player connected");

    ws.on("message", (message) => {
        console.log("Received:", message);
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on("close", () => {
        console.log("Player disconnected");
    });
});

const pool = require("./db");

app.get('/leaderboard', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM leaderboard ORDER BY score DESC LIMIT 10');
        res.json(result.rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});
