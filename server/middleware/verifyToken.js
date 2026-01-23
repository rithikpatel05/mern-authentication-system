const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Read from Cookie Jar
    const token = req.cookies.accessToken;
    
    if (!token) {
        return res.status(401).json({ error: "Access Denied: No Token" });
    }

    try {
        const verifiedUser = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = verifiedUser;
        next();
    } catch (err) {
        res.status(403).json({ error: "Invalid Token" });
    }
};

module.exports = verifyToken;