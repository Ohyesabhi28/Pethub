// Verifies Firebase ID tokens (works against emulator and live).
// Loads the user profile from Firestore so handlers can rely on req.user.role.
const { auth, db } = require('../firebase');
const { HttpError } = require('./error');

async function authMiddleware(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Missing bearer token');

    const decoded = await auth.verifyIdToken(token);
    // Pull role + name from Firestore. Custom claims are also set by /admin endpoints.
    let role = decoded.role || 'PetOwner';
    let name = decoded.name || decoded.email;
    try {
      const snap = await db.collection('users').doc(decoded.uid).get();
      if (snap.exists) {
        const d = snap.data();
        role = d.role || role;
        name = d.name || name;
      }
    } catch (_e) {
      // Firestore unreachable — fall back to token claims.
    }
    req.user = { uid: decoded.uid, email: decoded.email, role, name };
    next();
  } catch (err) {
    if (err instanceof HttpError) return next(err);
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, 'Not authenticated'));
    if (!allowed.includes(req.user.role)) {
      return next(new HttpError(403, `Requires role: ${allowed.join(' or ')}`));
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
