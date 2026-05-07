const pool = require('../../config/database');

const USER_FIELDS = `
  id,
  username,
  password_hash,
  full_name,
  email,
  role_code,
  account_status
`;

async function findUserByUsername(username) {
  const [rows] = await pool.query(
    `SELECT ${USER_FIELDS} FROM users WHERE username = ? LIMIT 1`,
    [username]
  );

  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await pool.query(
    `SELECT ${USER_FIELDS} FROM users WHERE id = ? LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

function isActiveAccount(user) {
  return !user.account_status || user.account_status === 'active';
}

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    role_code: user.role_code
  };
}

module.exports = {
  findUserByUsername,
  findUserById,
  isActiveAccount,
  toPublicUser
};
