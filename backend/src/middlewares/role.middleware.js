function requireRoles(allowedRoles) {
  return function roleGuard(req, res, next) {
    const currentRole = req.user && req.user.role_code;

    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: insufficient role',
        allowed_roles: allowedRoles
      });
    }

    next();
  };
}

module.exports = {
  requireRoles
};
