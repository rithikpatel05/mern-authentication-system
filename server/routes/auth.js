const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');

// --- CONFIG ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// --- HELPER: SET COOKIES ---
const sendTokenResponse = (user, statusCode, res) => {
    const accessToken = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '1d' });

    user.refreshToken = refreshToken;
    user.save();

    const options = {
        expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
        httpOnly: true,
    };

    res.status(statusCode)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json({ 
            success: true, 
            user: { name: user.name, email: user.email, picture: user.picture, provider: user.provider } 
        });
};

// --- ROUTES ---

// 1. SIGNUP
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword, provider: 'local', picture: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" });
        await newUser.save();
        res.status(201).json({ message: "User created" });
    } catch (err) { res.status(500).json({ error: "Signup failed" }); }
});

// 2. SIGNIN
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.mfaSecret = otp;
        user.mfaExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        const mailOptions = { from: 'My Secure App', to: user.email, subject: 'Your Code', text: `Code: ${otp}` };
        transporter.sendMail(mailOptions, (error) => {
            if (error) return res.status(500).json({ error: "Email failed" });
            res.json({ message: "OTP sent", mfaRequired: true, email: user.email });
        });
    } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

// 3. VERIFY MFA
router.post('/verify-mfa', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || user.mfaSecret !== otp || user.mfaExpires < Date.now()) {
            return res.status(400).json({ error: "Invalid or expired code" });
        }
        
        user.mfaSecret = undefined;
        user.mfaExpires = undefined;
        await user.save();

        sendTokenResponse(user, 200, res);

    } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

// 4. REFRESH TOKEN
router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) return res.status(401).json({ error: "No token" });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ error: "Invalid Refresh Token" });
        }

        const newAccessToken = jwt.sign(
            { id: user._id, name: user.name }, 
            process.env.JWT_ACCESS_SECRET, 
            { expiresIn: '15m' }
        );

        res.cookie('accessToken', newAccessToken, { 
            httpOnly: true, 
            expires: new Date(Date.now() + 15 * 60 * 1000) 
        });
        
        res.json({ success: true });

    } catch (err) { res.status(403).json({ error: "Invalid Token" }); }
});

// 5. LOGOUT
router.post('/logout', (req, res) => {
    res.cookie('accessToken', '', { expires: new Date(0) });
    res.cookie('refreshToken', '', { expires: new Date(0) });
    res.json({ message: "Logged out" });
});

// 6. GET CURRENT USER
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

module.exports = router;