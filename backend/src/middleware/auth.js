// src/middleware/auth.js
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, username, account_type }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Only allow organization accounts (e.g. for publishing courses) */
function requireOrganization(req, res, next) {
  if (req.user?.account_type !== 'organization') {
    return res.status(403).json({ error: 'Only organization accounts can perform this action' });
  }
  next();
}

module.exports = { requireAuth, requireOrganization };
