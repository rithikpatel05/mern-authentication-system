const router = require('express').Router();
const { CognitoIdentityProviderClient, InitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider");
const User = require('../models/User'); 
const verifyToken = require('../middleware/verifyToken'); 

const client = new CognitoIdentityProviderClient({ 
  region: process.env.AWS_REGION || "ap-south-1" 
});

// --- LOGIN ROUTE ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`🔐 Login attempt for: ${email}`); 

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: "73kdt77qvad8do4j3fqetu8k86", 
      AuthParameters: { USERNAME: email, PASSWORD: password },
    });

    const response = await client.send(command);
    console.log("✅ AWS Cognito Login Success!"); 

    const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;

    // Get User ID from Token
    const payloadPart = IdToken.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadPart));
    const userId = decodedPayload.sub;

    // Sync to MongoDB
    let user = await User.findOne({ cognitoId: userId });
    if (!user) {
      user = new User({
        cognitoId: userId,
        email: email, 
        username: email.split('@')[0]
      });
      await user.save();
    }

    // Set Cookies (Backup)
    const cookieOptions = { httpOnly: true, secure: true, sameSite: 'none', maxAge: 3600000 };
    res.cookie('accessToken', AccessToken, cookieOptions);
    res.cookie('refreshToken', RefreshToken, { ...cookieOptions, maxAge: 2592000000 });

    // ✅ THE FIX IS HERE: Added 'plan: user.plan'
    res.json({ 
      success: true, 
      message: "Login Success",
      token: AccessToken, 
      user: { 
        email: user.email, 
        username: user.username,
        plan: user.plan // 🟢 CRITICAL: This sends "GOLD" to the frontend!
      }
    });

  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ error: "Login failed", details: error.message });
  }
});

// --- ME ROUTE ---
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ cognitoId: req.user.sub || req.user.id });
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // ✅ ALSO FIXED HERE: Added 'plan: user.plan'
    res.json({ 
      success: true, 
      user: { 
        email: user.email, 
        username: user.username,
        plan: user.plan // 🟢 Ensures plan persists on page refresh
      } 
    });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

// --- LOGOUT ---
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true });
});

module.exports = router;