const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 1. Get the token from the Authorization header
  const authHeader = req.header('Authorization');

  // 2. Check if the header exists and is in the correct format ('Bearer <token>')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token or invalid format, authorization denied.' });
  }

  try {
    // 3. Extract the token from the header (remove 'Bearer ')
    const token = authHeader.split(' ')[1];

    // 4. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Add the user payload to the request object
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid.' });
  }
};