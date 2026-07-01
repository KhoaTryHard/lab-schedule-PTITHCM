require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./src/config/database');

async function seedCBDT() {
  try {
    const passwordHash = bcrypt.hashSync('123456', 10);
    const username = 'cbdt1';

    const [result] = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, email, role_code, account_status) 
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [username, passwordHash, 'CBDT Demo', 'cbdt1@ptit.edu.vn', 'CBDT']
    );

    console.log(` Import thành công user CBDT!`);
    console.log(`- Username: ${username}`);
    console.log(`- Password: 123456`);
    console.log(`- ID trong DB: ${result.insertId}`);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log(`User 'cbdt1' đã tồn tại trong database.`);
    } else {
      console.error(` Lỗi import:`, error.message);
    }
  } finally {
    process.exit(0);
  }
}

seedCBDT();
