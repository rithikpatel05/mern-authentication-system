const router = require('express').Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:5000/callback';
const FB_APP_ID = process.env.FACEBOOK_APP_ID;
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FB_REDIRECT_URI = 'http://localhost:5000/auth/facebook/callback';

// Helper to handle Social Users
const handleSocialLogin = async (userData, provider, providerIdName, providerId, res) => {
    let user = await User.findOne({ [providerIdName]: providerId });
    if (!user) {
        user = new User({ 
            name: userData.name, 
            email: userData.email, 
            password: "social-dummy-password", 
            picture: userData.picture, 
            provider: provider, 
            [providerIdName]: providerId 
        });
        await user.save();
    }
    
    // Create Tokens
    const accessToken = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '1d' });
    user.refreshToken = refreshToken;
    await user.save();

    // Set Cookies
    const options = { expires: new Date(Date.now() + 1* 24 * 60 * 60 * 1000), httpOnly: true };
    res.cookie('accessToken', accessToken, options);
    res.cookie('refreshToken', refreshToken, options);
    
    // Redirect to Dashboard
    res.redirect('http://localhost:3000/dashboard'); 
};

// LinkedIn Routes
router.get('/auth/linkedin/url', (req, res) => {
    const scope = 'openid profile email'; 
    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
    res.json({ url });
});

router.get('/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const params = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI, client_id: CLIENT_ID, client_secret: CLIENT_SECRET });
        const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        const userRes = await axios.get('https://api.linkedin.com/v2/userinfo', { headers: { 'Authorization': `Bearer ${tokenRes.data.access_token}` } });
        await handleSocialLogin(userRes.data, 'linkedin', 'linkedinId', userRes.data.sub, res);
    } catch (e) { res.redirect('http://localhost:3000'); }
});

// Facebook Routes
router.get('/auth/facebook/url', (req, res) => {
    const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(FB_REDIRECT_URI)}&scope=public_profile,email`;
    res.json({ url });
});

router.get('/auth/facebook/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const tokenRes = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, { params: { client_id: FB_APP_ID, client_secret: FB_APP_SECRET, redirect_uri: FB_REDIRECT_URI, code } });
        const userRes = await axios.get(`https://graph.facebook.com/me`, { params: { fields: 'name,email,picture.type(large)', access_token: tokenRes.data.access_token } });
        const userData = { name: userRes.data.name, email: userRes.data.email, picture: userRes.data.picture.data.url };
        await handleSocialLogin(userData, 'facebook', 'facebookId', userRes.data.id, res);
    } catch (e) { res.redirect('http://localhost:3000'); }
});

module.exports = router;