// server/cognitoAuth.js
const { CognitoJwtVerifier } = require("aws-jwt-verify");

// 1. Setup the Verifier with YOUR IDs
const verifier = CognitoJwtVerifier.create({
  userPoolId: "ap-south-1_5uGUkSbPX", 
  tokenUse: "access",
  clientId: "73kdt77qvad8do4j3fqetu8k86",
  
  // ✅ ADD THIS SECTION HERE:
  httpOptions: {
    responseTimeout: 10000 // Wait 10 seconds (default is 3000ms)
  }
});

// 2. The function that protects your routes
const verifyToken = async (req, res, next) => {
  try {
    // ✅ NEW: Read from Cookie
    const token = req.cookies.accessToken;

    if (!token) return res.status(401).json({ message: "No token provided" });

    // The rest is the same...
    const payload = await verifier.verify(token);
    req.user = { id: payload.sub, username: payload.username };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};

module.exports = verifyToken;