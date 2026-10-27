const express = require('express');
const session = require('express-session');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'demo-secret-change-me',
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.DB_NAME || 'divineshop_demo',
  user: process.env.DB_USER || 'divineshop_user',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: (process.env.DB_ENCRYPT || 'false').toLowerCase() === 'true',
    trustServerCertificate: (process.env.DB_TRUST_CERT || 'true').toLowerCase() === 'true',
    enableArithAbort: true
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};
const poolPromise = new sql.ConnectionPool(dbConfig).connect();

function needLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: 'Vui lòng đăng nhập.' });
  next();
}
function needAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ message: 'Bạn không có quyền admin.' });
  next();
}
function safeUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

app.get('/api/me', (req, res) => res.json({ user: req.session.user || null }));

app.post('/api/register', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { name, email, phone, password } = req.body;
    // DEFECT DEMO D001: cố ý chưa kiểm tra name rỗng ở server.
    if (!email || !password) return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
    const exists = await pool.request().input('email', sql.NVarChar(150), email)
      .query('SELECT id FROM dbo.users WHERE email=@email');
    if (exists.recordset.length) return res.status(409).json({ message: 'Email đã tồn tại.' });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.request()
      .input('name', sql.NVarChar(100), name || '')
      .input('email', sql.NVarChar(150), email)
      .input('phone', sql.NVarChar(20), phone || '')
      .input('hash', sql.NVarChar(255), hash)
      .query('INSERT INTO dbo.users(name,email,phone,password_hash) OUTPUT INSERTED.id VALUES(@name,@email,@phone,@hash)');
    res.json({ message: 'Đăng ký thành công. Bạn có thể đăng nhập.', id: result.recordset[0].id });
  } catch (e) { console.error('register:', e.message); res.status(500).json({ message: 'Lỗi máy chủ hoặc database chưa chạy.' }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { email, password } = req.body;
    const result = await pool.request().input('email', sql.NVarChar(150), email || '')
      .query('SELECT * FROM dbo.users WHERE email=@email');
    if (!result.recordset.length) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    const user = result.recordset[0];
    // DEFECT DEMO D002: cố ý không áp dụng failed_attempts / locked_until.
    const ok = await bcrypt.compare(password || '', user.password_hash);
    if (!ok) {
      await pool.request().input('id', sql.Int, user.id)
        .query('UPDATE dbo.users SET failed_attempts=failed_attempts+1 WHERE id=@id');
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }
    await pool.request().input('id', sql.Int, user.id)
      .query('UPDATE dbo.users SET failed_attempts=0 WHERE id=@id');
    req.session.user = safeUser(user);
    res.json({ message: 'Đăng nhập thành công.', user: req.session.user });
  } catch (e) { console.error('login:', e.message); res.status(500).json({ message: 'Lỗi máy chủ hoặc database chưa chạy.' }); }
});
app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ message: 'Đã đăng xuất.' })));

app.get('/api/products', async (req, res) => {
  try {
    const pool = await poolPromise;
    const q = String(req.query.q || '');
    const category = String(req.query.category || '');
    const sort = String(req.query.sort || '');
    let order = 'id ASC';
    if (sort === 'price-asc') order = 'price ASC';
    else if (sort === 'price-desc') order = 'price DESC';
    const result = await pool.request()
      .input('q', sql.NVarChar(180), q)
      .input('category', sql.NVarChar(80), category)
      .query(`SELECT * FROM dbo.products WHERE active=1 AND (@q=N'' OR name LIKE N'%' + @q + N'%' OR brand LIKE N'%' + @q + N'%') AND (@category=N'' OR category=@category) ORDER BY ${order}`);
    res.json(result.recordset);
  } catch (e) { console.error('products:', e.message); res.status(500).json({ message: 'Không tải được sản phẩm. Kiểm tra database.' }); }
});
app.get('/api/categories', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT DISTINCT category FROM dbo.products WHERE active=1 ORDER BY category');
    res.json(result.recordset.map(x => x.category));
  } catch (e) { res.status(500).json({ message: 'Lỗi database.' }); }
});
app.get('/api/products/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('id', sql.Int, Number(req.params.id))
      .query('SELECT * FROM dbo.products WHERE id=@id AND active=1');
    if (!result.recordset.length) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    res.json(result.recordset[0]);
  } catch (e) { res.status(500).json({ message: 'Lỗi database.' }); }
});

app.post('/api/orders', needLogin, async (req, res) => {
  let transaction;
  try {
    const pool = await poolPromise;
    const { name, phone, address, payment, items, coupon } = req.body;
    if (!name || !phone || !address || !Array.isArray(items) || !items.length)
      return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin giao hàng.' });
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    let total = 0;
    const prepared = [];
    for (const item of items) {
      const productResult = await new sql.Request(transaction)
        .input('id', sql.Int, Number(item.id))
        .query('SELECT * FROM dbo.products WITH (UPDLOCK, ROWLOCK) WHERE id=@id AND active=1');
      if (!productResult.recordset.length) throw new Error('Sản phẩm không tồn tại.');
      const p = productResult.recordset[0];
      const qty = Number(item.quantity);
      // DEFECT DEMO D003: cố ý chưa chặn qty lớn hơn tồn kho.
      if (!Number.isInteger(qty) || qty < 1) throw new Error('Số lượng không hợp lệ.');
      total += Number(p.price) * qty;
      prepared.push({ p, qty });
      await new sql.Request(transaction).input('qty', sql.Int, qty).input('id', sql.Int, p.id)
        .query('UPDATE dbo.products SET stock=CASE WHEN stock-@qty<0 THEN 0 ELSE stock-@qty END WHERE id=@id');
    }
    if (coupon) {
      const couponResult = await new sql.Request(transaction).input('code', sql.NVarChar(30), String(coupon).toUpperCase())
        .query('SELECT * FROM dbo.coupons WHERE code=@code AND active=1');
      // DEFECT DEMO D004: cố ý bỏ qua expires_at.
      if (couponResult.recordset.length) total = Math.round(total * (100 - couponResult.recordset[0].percent_off) / 100);
      else throw new Error('Mã giảm giá không hợp lệ.');
    }
    const orderResult = await new sql.Request(transaction)
      .input('userId', sql.Int, req.session.user.id)
      .input('name', sql.NVarChar(100), name)
      .input('phone', sql.NVarChar(20), phone)
      .input('address', sql.NVarChar(255), address)
      .input('payment', sql.NVarChar(30), payment || 'COD')
      .input('total', sql.Decimal(12, 0), total)
      .query('INSERT INTO dbo.orders(user_id,customer_name,phone,address,payment_method,total) OUTPUT INSERTED.id VALUES(@userId,@name,@phone,@address,@payment,@total)');
    const orderId = orderResult.recordset[0].id;
    for (const item of prepared) {
      await new sql.Request(transaction)
        .input('orderId', sql.Int, orderId).input('productId', sql.Int, item.p.id)
        .input('productName', sql.NVarChar(180), item.p.name).input('qty', sql.Int, item.qty)
        .input('price', sql.Decimal(12, 0), item.p.price)
        .query('INSERT INTO dbo.order_items(order_id,product_id,product_name,quantity,price) VALUES(@orderId,@productId,@productName,@qty,@price)');
    }
    await transaction.commit();
    res.json({ message: 'Đặt hàng thành công!', orderId, total });
  } catch (e) {
    if (transaction) { try { await transaction.rollback(); } catch (_) {} }
    console.error('orders:', e.message);
    res.status(400).json({ message: e.message || 'Không thể đặt hàng.' });
  }
});
app.get('/api/my-orders', needLogin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('userId', sql.Int, req.session.user.id)
      .query('SELECT * FROM dbo.orders WHERE user_id=@userId ORDER BY id DESC');
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ message: 'Lỗi database.' }); }
});

app.get('/api/admin/products', needAdmin, async (req, res) => {
  try { const pool = await poolPromise; const r = await pool.request().query('SELECT * FROM dbo.products ORDER BY id DESC'); res.json(r.recordset); }
  catch (e) { res.status(500).json({ message: 'Lỗi database.' }); }
});
app.post('/api/admin/products', needAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const { name, category, brand, description, price, stock, image } = req.body;
    if (!name || !category || Number(price) < 0 || Number(stock) < 0) return res.status(400).json({ message: 'Dữ liệu sản phẩm không hợp lệ.' });
    const r = await pool.request()
      .input('name', sql.NVarChar(180), name).input('category', sql.NVarChar(80), category)
      .input('brand', sql.NVarChar(80), brand || '').input('description', sql.NVarChar(sql.MAX), description || '')
      .input('price', sql.Decimal(12, 0), Number(price)).input('stock', sql.Int, Number(stock))
      .input('image', sql.NVarChar(500), image || 'https://placehold.co/600x400?text=Product')
      .query('INSERT INTO dbo.products(name,category,brand,description,price,stock,image) OUTPUT INSERTED.id VALUES(@name,@category,@brand,@description,@price,@stock,@image)');
    res.json({ message: 'Đã thêm sản phẩm.', id: r.recordset[0].id });
  } catch (e) { console.error('admin add product:', e.message); res.status(500).json({ message: 'Không thể thêm sản phẩm.' }); }
});
app.delete('/api/admin/products/:id', needAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().input('id', sql.Int, Number(req.params.id)).query('UPDATE dbo.products SET active=0 WHERE id=@id');
    res.json({ message: 'Đã xóa sản phẩm khỏi cửa hàng.' });
  } catch (e) { res.status(500).json({ message: 'Không thể xóa sản phẩm.' }); }
});
app.get('/api/admin/orders', needAdmin, async (req, res) => {
  try { const pool = await poolPromise; const r = await pool.request().query('SELECT * FROM dbo.orders ORDER BY id DESC'); res.json(r.recordset); }
  catch (e) { res.status(500).json({ message: 'Lỗi database.' }); }
});
app.get('/api/admin/stats', needAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const p = await pool.request().query('SELECT COUNT(*) AS total FROM dbo.products WHERE active=1');
    const o = await pool.request().query('SELECT COUNT(*) AS total FROM dbo.orders');
    const u = await pool.request().query("SELECT COUNT(*) AS total FROM dbo.users WHERE role=N'customer'");
    res.json({ products: p.recordset[0].total, orders: o.recordset[0].total, customers: u.recordset[0].total });
  } catch (e) { res.status(500).json({ message: 'Lỗi database.' }); }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log('DivineShop demo chạy tại http://localhost:' + port);
  try { await poolPromise; console.log('Đã kết nối SQL Server: ' + dbConfig.server + ' / ' + dbConfig.database); }
  catch (e) { console.error('Không kết nối được SQL Server:', e.message); }
});
