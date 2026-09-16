// middleware/adminMiddleware.js
// Must run AFTER authMiddleware.protect, since it relies on req.user
// already being populated from a verified JWT.

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
}

module.exports = { requireAdmin };
