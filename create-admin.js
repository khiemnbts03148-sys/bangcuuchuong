require('dotenv').config();
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const config = {
  server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.DB_NAME || 'divineshop_demo',
  user: process.env.DB_USER || 'divineshop_user',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: (process.env.DB_ENCRYPT || 'false').toLowerCase() === 'true',
    trustServerCertificate: (process.env.DB_TRUST_CERT || 'true').toLowerCase() === 'true'
  }
};
(async () => {
  const pool = await sql.connect(config);
  const hash = await bcrypt.hash('Admin@123', 10);
  await pool.request()
    .input('name', sql.NVarChar(100), 'Demo Admin')
    .input('email', sql.NVarChar(150), 'admin@demo.local')
    .input('phone', sql.NVarChar(20), '0900000000')
    .input('hash', sql.NVarChar(255), hash)
    .query(`IF EXISTS (SELECT 1 FROM dbo.users WHERE email=@email)
      UPDATE dbo.users SET role=N'admin' WHERE email=@email;
      ELSE INSERT INTO dbo.users(name,email,phone,password_hash,role) VALUES(@name,@email,@phone,@hash,N'admin');`);
  console.log('Admin demo: admin@demo.local / Admin@123');
  await pool.close();
})().catch(e => { console.error('Không tạo được admin:', e.message); process.exit(1); });
