function requireAuth(req, res, next) {
  // TODO: Replace with JWT verification in Priority 4/Week 2.
  req.user = {
    id: 1,
    username: 'academic_officer1',
    role_code: 'CBDT'
  };
  next();
}

module.exports = {
  requireAuth
};
