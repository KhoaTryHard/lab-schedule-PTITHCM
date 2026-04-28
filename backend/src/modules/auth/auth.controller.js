const { ok } = require('../../utils/apiResponse');

function login(req, res) {
  // TODO: Implement real login using users table, bcrypt, JWT.
  return ok(res, {
    token: 'demo-token',
    user: {
      id: 1,
      username: req.body.username || 'academic_officer1',
      full_name: 'Demo Academic Officer',
      role_code: 'CBDT'
    }
  }, 'Demo login successful');
}

function me(req, res) {
  return ok(res, {
    user: req.user
  });
}

function logout(req, res) {
  return ok(res, null, 'Logged out');
}

module.exports = {
  login,
  me,
  logout
};
