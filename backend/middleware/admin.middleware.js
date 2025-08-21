// This function checks if the user's role is 'admin'
module.exports = function(req, res, next) {
  // We assume the auth.middleware has already run and added req.user
  if (req.user && req.user.role === 'admin') {
    // If the user is an admin, proceed to the next function
    next();
  } else {
    // If not an admin, send a 403 (Forbidden) error
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};