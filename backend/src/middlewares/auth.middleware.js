const jwt = require('jsonwebtoken');

const { fail } = require('../utils/apiResponse');
const {
  findUserById,
  isActiveAccount
} = require('../modules/auth/auth.service');

function requireAuth(req, res, next) {
  const authHeader = req.get('authorization');

  if (!authHeader) {
    return fail(res, 401, 'Authorization token is required');
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return fail(res, 401, 'Invalid authorization header');
  }

  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is not configured');
    error.statusCode = 500;
    return next(error);
  }

  try {
    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);

    if (!decoded || !decoded.id || !decoded.role_code) {
      return fail(res, 401, 'Invalid token');
    }

    return findUserById(decoded.id)
      .then((user) => {
        if (!user) {
          return fail(res, 401, 'User not found');
        }

        if (!isActiveAccount(user)) {
          return fail(res, 403, 'Account is not active');
        }

        req.user = {
          id: user.id,
          username: user.username,
          role_code: user.role_code
        };

        return next();
      })
      .catch(next);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return fail(res, 401, 'Token expired');
    }

    return fail(res, 401, 'Invalid token');
  }
}

module.exports = {
  requireAuth
};
