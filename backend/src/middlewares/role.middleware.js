const { fail } = require('../utils/apiResponse');

function normalizeRoles(roles) {
  if (roles.length === 1 && Array.isArray(roles[0])) {
    return roles[0];
  }

  return roles;
}

function requireRoles(...roles) {
  const allowedRoles = normalizeRoles(roles);

  return function roleGuard(req, res, next) {
    if (!req.user) {
      return fail(res, 401, 'Authentication is required');
    }

    const currentRole = req.user && req.user.role_code;

    if (!allowedRoles.includes(currentRole)) {
      return fail(res, 403, 'Forbidden: insufficient role', {
        allowed_roles: allowedRoles
      });
    }

    return next();
  };
}

module.exports = {
  requireRoles
};
