const serviceAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing service token' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.SERVICE_SECRET;

  if (!secret) {
    console.error('CRITICAL: SERVICE_SECRET is not defined in environment variables.');
    return res.status(500).json({ success: false, error: 'Server misconfiguration' });
  }

  if (token !== secret) {
    return res.status(403).json({ success: false, error: 'Forbidden: Invalid service token' });
  }

  next();
};

module.exports = serviceAuth;
