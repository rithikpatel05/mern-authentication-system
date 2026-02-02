require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Import Routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const stockRoutes = require('./routes/stocks');

const app = express();

// --- MIDDLEWARE ---
// const cors = require('cors');

app.use(cors({
    origin: function (origin, callback) {
        // 1. Allow requests with no origin (like Postman or mobile apps)
        if (!origin) return callback(null, true);
        
        // 2. Allow any origin that matches your specific lists
        const allowedOrigins = [
            "http://localhost:3000",                        // Local dev
            "http://192.168.0.23:3000",                     // Your WiFi IP (from your screenshot)
            "https://hymenopterous-overventurous-roxane.ngrok-free.dev",
            "https://mern-authentication-system-alpha.vercel.app" // Your specific Ngrok URL
        ];

        // Check if the incoming origin is in our list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            console.log("🚫 Blocked by CORS:", origin); // Helps debug if it fails again
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Important if you are using cookies/sessions
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"]
}));

app.use(express.json());
app.use(cookieParser());

// --- DATABASE ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// --- ROUTES ---
app.use('/auth', authRoutes); 
app.use('/files', fileRoutes); 
app.use('/stocks', stockRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Use the port Render gives us, or 5000 if we are on localhost
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});