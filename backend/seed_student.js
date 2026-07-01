require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./src/config/database');

async function seedStudent() {
  try {
    const passwordHash = bcrypt.hashSync('123456', 10);
    const username = 'student1';

    const [result] = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, email, role_code, account_status) 
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [username, passwordHash, 'Sinh Viên Demo', 'student1@ptit.edu.vn', 'SV']
    );

    console.log(` Import thành công user sinh viên!`);
    console.log(`- Username: ${username}`);
    console.log(`- Password: 123456`);
    console.log(`- ID trong DB: ${result.insertId}`);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log(`User 'student1' đã tồn tại trong database.`);
    } else {
      console.error(` Lỗi import:`, error.message);
    }
  } finally {
    process.exit(0);
  }
}

seedStudent();
