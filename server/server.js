require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Import Routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const socialRoutes = require('./routes/socialAuth');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// --- USE ROUTES ---

// 1. Auth Routes
// Mounts at: /auth/signup, /auth/signin, etc.
app.use('/auth', authRoutes); 

// 2. File Routes
// Mounts at: /files/upload, /files/
app.use('/files', fileRoutes); 

// 3. Social Routes
// Mounts at root (/) to keep callbacks working
app.use('/', socialRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));