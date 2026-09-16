// middleware/authMiddleware.js
// Verifies the JWT sent in the Authorization header and attaches the
// decoded user payload to req.user so downstream handlers can use it.

const jwt = require('jsonwebtoken');
require('dotenv').config();

function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

// Optional auth: attaches req.user if a valid token is present, but
// never blocks the request — useful for routes that behave slightly
// differently for logged-in users without requiring login.
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    } catch (err) {
      // ignore invalid token — treat as anonymous
    }
  }
  next();
}

module.exports = { protect, optionalAuth };
