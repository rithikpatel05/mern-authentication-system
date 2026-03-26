require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');//

const app = express();
const server = http.createServer(app);//

// --- MIDDLEWARE ---
app.use(cors({
    origin: true, 
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ==========================================
// 1. SETUP REDIS FIRST
// ==========================================
const redis = require('redis');
const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('❌ Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Redis Connected Successfully!'));

(async () => {
    await redisClient.connect();

})();

app.set("redis", redisClient);


// ==========================================
// 2. SETUP SOCKET.IO SECOND (Now it can use Redis)
// ==========================================
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
});

app.set("io", io);

io.on("connection", (socket) => {
    const userEmail = socket.handshake.query.email;

    if (userEmail) {
        console.log(`⚡ ${userEmail} connected!`);

        // SADD adds a unique value to a set
        redisClient.sAdd("online_users", userEmail).then(() => {
            // Tell EVERYONE someone new is online
            io.emit("user_status_change");

        });
    }

    socket.on("disconnect", async () => {
        if (userEmail) {
            console.log(`🔌 ${userEmail} disconnected`);
            
            // Remove them from the Redis set
            await redisClient.sRem("online_users", userEmail);
        
            
            // Tell everyone someone left
            io.emit("user_status_change");
             
        }
    });
});


// ==========================================
// 3. YOUR ROUTES
// ==========================================
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const stockRoutes = require('./routes/stocks');

app.use('/auth', authRoutes); 
app.use('/files', fileRoutes); 
app.use('/stocks', stockRoutes);
app.use("/api/stripe", require("./routes/stripe"));

// 🟢 NEW: Route to get the list of online users
app.get("/api/online-status", async (req, res) => {
    try {
        // SMEMBERS returns an array of all emails in the set
        const onlineUsers = await redisClient.sMembers("online_users");
        res.json({ onlineUsers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not fetch online status" });
    }
});

app.get("/", (req, res) => {
  res.send("API is running...");
});

// ==========================================
// 4. DATABASE & SERVER START
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))//
  .catch(err => console.log("❌ MongoDB Error:", err));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
