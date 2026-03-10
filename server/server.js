require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');


// 🟢 NEW 1: Import Node's built-in HTTP module and Socket.io
const http = require('http');
const { Server } = require('socket.io');

// Import Routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const stockRoutes = require('./routes/stocks');

const app = express();

// 🟢 NEW 2: Create an HTTP server and wrap your Express app inside it
const server = http.createServer(app);

// 🟢 NEW 3: Initialize Socket.io attached to that server, matching your CORS rules
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
});

// 🟢 NEW 4: Attach 'io' to your Express app so your routes can use it later!
app.set("io", io);

// 🟢 NEW 5: Listen for connections just to prove it works in your terminal
io.on("connection", (socket) => {
    console.log("⚡ A user connected to WebSockets!");
    
    socket.on("disconnect", () => {
        console.log("🔌 User disconnected");
    });
});





// --- MIDDLEWARE ---
app.use(cors({
    origin: true, 
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());


// 🟢 REDIS 1: Import the package
const redis = require('redis');

// By default, it automatically looks for a local Redis server running on port 6379
// Tell Redis to use the Upstash URL from your .env file
const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

// 🟢 REDIS 3: Add error handling (Crucial so your app doesn't crash if Redis turns off)
redisClient.on('error', (err) => console.log('❌ Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Redis Connected Successfully!'));

// 🟢 REDIS 4: Actually connect it
// Note: connecting is asynchronous, so we wrap it in a quick self-calling function, 
// or just chain .connect() since modern Node allows top-level awaits in some setups.
(async () => {
    await redisClient.connect();
})();

// 🟢 REDIS 5: Attach 'redisClient' to Express so routes can use it!
app.set("redis", redisClient);

// --- DATABASE ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// --- ROUTES ---
app.use('/auth', authRoutes); 
app.use('/files', fileRoutes); 
app.use('/stocks', stockRoutes);
app.use("/api/stripe", require("./routes/stripe"));

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Use the port Render gives us, or 5000 if we are on localhost
const PORT = process.env.PORT || 5000;

// 🟢 NEW 6: Change app.listen to server.listen!
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});