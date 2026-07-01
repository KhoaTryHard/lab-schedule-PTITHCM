const bcrypt = require("bcryptjs");

const pool = require("../../config/database");
const { recordAuditLog } = require("../audit/audit.service");

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
    [username],
  );

  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await pool.query(
    `SELECT ${USER_FIELDS} FROM users WHERE id = ? LIMIT 1`,
    [id],
  );

  return rows[0] || null;
}

function makeAuthError(statusCode, message, details = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function normalizePasswordInput(input, field) {
  if (typeof input !== "string" || !input.trim()) {
    const labels = {
      currentPassword: "Mật khẩu hiện tại là bắt buộc.",
      newPassword: "Mật khẩu mới là bắt buộc.",
      confirmPassword: "Xác nhận mật khẩu mới là bắt buộc.",
    };

    const message = labels[field] || "Thông tin mật khẩu là bắt buộc.";
    throw makeAuthError(400, message, [{ field, message }]);
  }

  return input;
}

function validateNewPassword(newPassword, confirmPassword) {
  if (newPassword !== confirmPassword) {
    throw makeAuthError(400, "Mật khẩu mới và xác nhận mật khẩu không khớp.", [
      {
        field: "confirmPassword",
        message: "Mật khẩu mới và xác nhận mật khẩu không khớp.",
      },
    ]);
  }

  if (newPassword.length < 6 || newPassword.length > 72) {
    throw makeAuthError(400, "Mật khẩu mới không hợp lệ.", [
      {
        field: "newPassword",
        message: "Mật khẩu mới phải có từ 6 đến 72 ký tự.",
      },
    ]);
  }
}

async function changeOwnPassword(userId, input = {}) {
  const currentPassword = normalizePasswordInput(
    input.currentPassword,
    "currentPassword",
  );
  const newPassword = normalizePasswordInput(input.newPassword, "newPassword");
  const confirmPassword = normalizePasswordInput(
    input.confirmPassword,
    "confirmPassword",
  );

  validateNewPassword(newPassword, confirmPassword);

  const user = await findUserById(userId);

  if (!user) {
    throw makeAuthError(404, "Không tìm thấy người dùng.");
  }

  if (!isActiveAccount(user)) {
    throw makeAuthError(403, "Tài khoản không còn hoạt động.");
  }

  const currentPasswordMatches = await bcrypt.compare(
    currentPassword,
    user.password_hash,
  );

  if (!currentPasswordMatches) {
    throw makeAuthError(400, "Mật khẩu hiện tại không đúng.");
  }

  const newPasswordMatchesOld = await bcrypt.compare(
    newPassword,
    user.password_hash,
  );

  if (newPasswordMatchesOld) {
    throw makeAuthError(400, "Mật khẩu mới không hợp lệ.", [
      {
        field: "newPassword",
        message: "Mật khẩu mới không được trùng mật khẩu hiện tại.",
      },
    ]);
  }

  const nextPasswordHash = await bcrypt.hash(newPassword, 10);
  const [result] = await pool.query(
    "UPDATE users SET password_hash = ? WHERE id = ?",
    [nextPasswordHash, user.id],
  );

  if (result.affectedRows === 0) {
    throw makeAuthError(404, "Không tìm thấy người dùng.");
  }

  await recordAuditLog({
    entity_type: "users",
    entity_id: user.id,
    action_type: "change_password",
    action_by_user_id: user.id,
    action_notes: {
      username: user.username,
    },
  });

  return toPublicUser(user);
}

function isActiveAccount(user) {
  return !user.account_status || user.account_status === "active";
}

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    role_code: user.role_code,
  };
}

module.exports = {
  changeOwnPassword,
  findUserByUsername,
  findUserById,
  isActiveAccount,
  toPublicUser,
};
