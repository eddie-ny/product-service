const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log("Auth Header:", authHeader);  // Log header

    const token = authHeader && authHeader.split(' ')[1]; // Extract token
    console.log("Extracted Token:", token);  // Log token

    if (!token) {
        console.log("No Token Provided!");
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("Token Verification Failed:", err.message);
            return res.sendStatus(403); // Forbidden
        }
        req.user = user;  // Store decoded user info in request
        console.log("Token Verified, User:", user); // Log user
        next();
    });
};

module.exports = authenticateToken;
