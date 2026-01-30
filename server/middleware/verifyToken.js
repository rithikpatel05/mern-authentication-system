const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // 1. Get Token from Header (Primary) OR Cookie (Backup)
  const authHeader = req.header('Authorization');
  const cookieToken = req.cookies ? req.cookies.accessToken : null;

  let token = authHeader || cookieToken;

  console.log(`🛡️  Auth Check: ${req.originalUrl}`);

  if (!token) {
    console.log("   ❌ REJECTED: No token found in Header or Cookie.");
    return res.status(403).json({ error: "Access Denied" });
  }

  // 2. Clean up the token (Remove "Bearer " if it exists)
  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length).trimLeft();
  }

  try {
    // 3. Verify
    // Note: Since we are using AWS Access Tokens, we decode them to get the user ID.
    const decoded = jwt.decode(token);
    
    if (!decoded) {
        throw new Error("Token could not be decoded");
    }

    req.user = {
        id: decoded.sub,
        email: decoded.username || "user"
    };

    // console.log("   ✅ APPROVED User:", req.user.id);
    next();
  } catch (err) {
    console.log("   ❌ REJECTED: Invalid Token", err.message);
    res.status(403).json({ error: "Invalid Token" });
  }
};

module.exports = verifyToken;