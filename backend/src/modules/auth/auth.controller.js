const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { ok, fail } = require('../../utils/apiResponse');
const {
  findUserById,
  findUserByUsername,
  isActiveAccount,
  toPublicUser
} = require('./auth.service');

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is not configured');
    error.statusCode = 500;
    throw error;
  }

  return process.env.JWT_SECRET;
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role_code: user.role_code
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    }
  );
}

async function login(req, res) {
  const body = req.body || {};
  const username = String(body.username || '').trim();
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password.trim()) {
    return fail(res, 400, 'Username and password are required');
  }

  const user = await findUserByUsername(username);

  if (!user) {
    return fail(res, 401, 'Invalid username or password');
  }

  if (!isActiveAccount(user)) {
    return fail(res, 403, 'Account is not active');
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    return fail(res, 401, 'Invalid username or password');
  }

  return ok(res, {
    token: signToken(user),
    user: toPublicUser(user)
  }, 'Login successful');
}

async function me(req, res) {
  const user = await findUserById(req.user.id);

  if (!user) {
    return fail(res, 401, 'User not found');
  }

  if (!isActiveAccount(user)) {
    return fail(res, 403, 'Account is not active');
  }

  return ok(res, toPublicUser(user), 'Success');
}

function logout(req, res) {
  // JWT is stateless in this MVP; the frontend should remove its stored token.
  return ok(res, null, 'Logout successful');
}

module.exports = {
  login,
  me,
  logout
};
