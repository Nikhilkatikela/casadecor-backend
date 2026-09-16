// utils/seedAdmin.js
// The SQL seed file ships with a placeholder bcrypt hash that will NOT work.
// Run `npm run seed:admin` once after setting up the database to create
// (or update) a real admin account with a properly hashed password.

const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
require('dotenv').config();

async function seedAdmin() {
  const email = 'admin@casadecor.com';
  const plainPassword = 'Admin@123'; // change this after first login
  const hashed = await bcrypt.hash(plainPassword, 10);

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

  if (existing.length) {
        await pool.query('UPDATE users SET password = ?, role = ? WHERE email = ?', [hashed, 'admin', email]);
    console.log(`✅ Updated existing admin account: ${email}`);
  } else {
    await pool.query(
      'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      ['Admin User', email, '9999999999', hashed, 'admin']
    );
    console.log(`✅ Created admin account: ${email}`);
  }
  console.log(`   Login with email "${email}" and password "${plainPassword}", then change it.`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('❌ Failed to seed admin:', err.message);
  process.exit(1);
});
