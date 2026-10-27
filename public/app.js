let products = [];
let user = null;
let cart = JSON.parse(localStorage.getItem('ds_cart') || '[]');
const $ = id => document.getElementById(id);
const money = n => Number(n || 0).toLocaleString('vi-VN') + ' ₫';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json().catch(() => ({ message: 'Lỗi phản hồi máy chủ.' }));
  if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra.');
  return data;
}
function say(text) { $('message').textContent = text || ''; }
function saveCart() { localStorage.setItem('ds_cart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount() { $('cartCount').textContent = cart.reduce((n, x) => n + Number(x.quantity), 0); }
async function loadMe() {
  try { const d = await api('/api/me'); user = d.user; } catch (e) { user = null; }
  $('authLink').textContent = user ? user.name + ' · ' + (user.role === 'admin' ? 'Admin' : 'Tài khoản') : 'Đăng nhập';
  $('authLink').onclick = () => user ? showAccount() : showAuth('login');
}
async function loadCategories() {
  try { const cats = await api('/api/categories'); $('categoryFilter').innerHTML = '<option value="">Tất cả danh mục</option>' + cats.map(c => `<option>${esc(c)}</option>`).join(''); } catch (e) { }
}
async function loadProducts() {
  try {
    const q = encodeURIComponent($('searchInput').value.trim()), cat = encodeURIComponent($('categoryFilter').value), sort = encodeURIComponent($('sortFilter').value);
    products = await api(`/api/products?q=${q}&category=${cat}&sort=${sort}`);
    $('products').innerHTML = products.length ? products.map(p => `<article class="product-card">
   <img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.src='https://placehold.co/600x400?text=Product'">
   <div class="product-info"><span class="tag">${esc(p.category)}</span><h3>${esc(p.name)}</h3><div class="desc">${esc(p.description || 'Sản phẩm kỹ thuật số')}</div>
   <div class="price">${money(p.price)}</div><div class="stock">Còn ${p.stock} sản phẩm</div>
   <div class="actions"><button onclick="addCart(${p.id})">Thêm giỏ</button><button onclick="showDetail(${p.id})">Chi tiết</button></div></div></article>`).join('') : '<p>Không tìm thấy sản phẩm phù hợp.</p>';
    say('');
  } catch (e) { $('products').innerHTML = '<p>Chưa kết nối được database. Hãy làm theo README.md.</p>'; say(e.message); }
}
function showHome() { $('productsSection').classList.remove('hidden'); $('content').classList.add('hidden'); loadProducts(); }
function addCart(id) {
  const p = products.find(x => Number(x.id) === Number(id)); if (!p) return;
  const old = cart.find(x => Number(x.id) === Number(id));
  // DEFECT DEMO D003: không chặn số lượng vượt tồn kho khi thêm vào giỏ.
  if (old) old.quantity++; else cart.push({ id: p.id, name: p.name, price: Number(p.price), stock: Number(p.stock), image: p.image, quantity: 1 });
  saveCart(); say('Đã thêm sản phẩm vào giỏ hàng.');
}
async function showDetail(id) {
  try { const p = await api('/api/products/' + id); $('modalContent').innerHTML = `<div class="detail-layout"><img src="${esc(p.image)}" alt="${esc(p.name)}"><div><span class="tag">${esc(p.category)}</span><h2>${esc(p.name)}</h2><p class="muted">${esc(p.description)}</p><p>Thương hiệu: <b>${esc(p.brand)}</b></p><p>Tồn kho: ${p.stock}</p><div class="price">${money(p.price)}</div><button class="btn" onclick="addCart(${p.id});closeModal()">Thêm vào giỏ hàng</button></div></div>`; $('modal').classList.remove('hidden'); }
  catch (e) { alert(e.message); }
}
function closeModal() { $('modal').classList.add('hidden'); }
function showAuth(mode) {
  $('productsSection').classList.add('hidden'); $('content').classList.remove('hidden');
  $('content').innerHTML = mode === 'register' ? `<h2>Tạo tài khoản</h2><p class="muted">Đăng ký tài khoản khách hàng để đặt hàng.</p>
 <form id="authForm"><div class="form-grid">
 <label class="field">Họ và tên<input name="name" placeholder=" "></label>
 <label class="field">Email<input name="email" type="email" required placeholder=" "></label>
 <label class="field">Số điện thoại<input name="phone" placeholder=" "></label>
 <label class="field">Mật khẩu<input name="password" type="password" required minlength="6" placeholder="Ít nhất 6 ký tự"></label>
 </div><div class="form-actions"><button class="btn">Đăng ký</button></div><div id="authMsg" class="message"></div></form>
 <p class="auth-switch">Đã có tài khoản? <a onclick="showAuth('login')">Đăng nhập</a></p>`:
    `<h2>Đăng nhập</h2><p class="muted">Đăng nhập tài khoản khách hàng hoặc quản trị viên.</p>
 <form id="authForm"><div class="form-grid"><label class="field full">Email<input name="email" type="email" required placeholder="Email"></label><label class="field full">Mật khẩu<input name="password" type="password" required placeholder="Mật khẩu"></label></div>
 <div class="form-actions"><button class="btn">Đăng nhập</button></div><div id="authMsg" class="message"></div></form>
 <p class="auth-switch">Chưa có tài khoản? <a onclick="showAuth('register')">Đăng ký ngay</a></p>
 <p class="muted">    </p>`;
  $('authForm').onsubmit = async e => {
    e.preventDefault(); const f = new FormData(e.target), body = Object.fromEntries(f.entries());
    try {
      const d = await api(mode === 'register' ? '/api/register' : '/api/login', { method: 'POST', body: JSON.stringify(body) });
      $('authMsg').textContent = d.message;
      if (mode === 'login') { user = d.user; await loadMe(); setTimeout(() => user.role === 'admin' ? showAdmin() : showHome(), 500); }
      else setTimeout(() => showAuth('login'), 800);
    } catch (err) { $('authMsg').textContent = err.message; }
  };
}
function showAccount() {
  $('productsSection').classList.add('hidden'); $('content').classList.remove('hidden');
  $('content').innerHTML = `<h2>Tài khoản</h2><p>Xin chào <b>${esc(user.name)}</b> (${esc(user.email)})</p><p class="muted">Vai trò: ${user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</p><div class="form-actions"><button class="btn" onclick="showOrders()">Đơn hàng của tôi</button>${user.role === 'admin' ? '<button class="btn secondary" onclick="showAdmin()">Trang quản trị</button>' : ''}<button class="btn danger" onclick="logout()">Đăng xuất</button></div>`;
}
async function logout() { await api('/api/logout', { method: 'POST' }); user = null; await loadMe(); showHome(); }
function showCart() {
  $('productsSection').classList.add('hidden'); $('content').classList.remove('hidden');
  if (!cart.length) { $('content').innerHTML = '<h2>Giỏ hàng</h2><p>Giỏ hàng đang trống.</p><button class="btn" onclick="showHome()">Tiếp tục mua sắm</button>'; return; }
  $('content').innerHTML = '<h2>Giỏ hàng</h2>' + cart.map((x, i) => `<div class="cart-row"><div><b>${esc(x.name)}</b><p class="muted">${money(x.price)} / sản phẩm</p></div><div><input type="number" min="1" value="${x.quantity}" onchange="changeQty(${i},this.value)"></div><button class="btn danger" onclick="removeCart(${i})">Xóa</button></div>`).join('') + `<div class="total">Tổng: ${money(cart.reduce((n, x) => n + x.price * x.quantity, 0))}</div><div class="form-actions"><button class="btn" onclick="showCheckout()">Thanh toán</button><button class="btn secondary" onclick="clearCart()">Xóa toàn bộ</button><button class="btn secondary" onclick="showHome()">Mua tiếp</button></div>`;
}
function changeQty(i, value) { cart[i].quantity = Math.max(1, Number(value) || 1); saveCart(); showCart(); }
function removeCart(i) { cart.splice(i, 1); saveCart(); showCart(); }
function clearCart() { cart = []; saveCart(); showCart(); }
function showCheckout() {
  if (!user) { showAuth('login'); return; }
  $('productsSection').classList.add('hidden'); $('content').classList.remove('hidden');
  $('content').innerHTML = `<h2>Thông tin thanh toán</h2><form id="checkoutForm"><div class="form-grid">
 <label class="field">Họ tên người nhận<input name="name" required value="${esc(user.name)}"></label>
 <label class="field">Số điện thoại<input name="phone" required></label>
 <label class="field full">Địa chỉ giao hàng<textarea name="address" required rows="2"></textarea></label>
 <label class="field">Phương thức thanh toán<select name="payment"><option value="COD">Thanh toán khi nhận hàng (COD)</option><option value="Bank">Chuyển khoản</option></select></label>
 <label class="field">Mã giảm giá<input name="coupon" placeholder="WELCOME10"></label></div>
 <div class="total">Tổng tạm tính: ${money(cart.reduce((n, x) => n + x.price * x.quantity, 0))}</div><div id="checkoutMsg" class="message"></div><div class="form-actions"><button class="btn">Đặt hàng</button><button type="button" class="btn secondary" onclick="showCart()">Quay lại giỏ hàng</button></div></form>`;
  $('checkoutForm').onsubmit = async e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target).entries());
    try { const d = await api('/api/orders', { method: 'POST', body: JSON.stringify({ ...f, items: cart.map(x => ({ id: x.id, quantity: x.quantity })) }) }); cart = []; saveCart(); $('checkoutMsg').textContent = `${d.message} Mã đơn: #${d.orderId} — ${money(d.total)}`; setTimeout(showOrders, 1200); }
    catch (err) { $('checkoutMsg').textContent = err.message; }
  };
}
async function showOrders() {
  if (!user) { showAuth('login'); return; }
  $('productsSection').classList.add('hidden'); $('content').classList.remove('hidden');
  try { const rows = await api('/api/my-orders'); $('content').innerHTML = '<h2>Đơn hàng của tôi</h2>' + (rows.length ? `<div class="table-wrap"><table><thead><tr><th>Mã đơn</th><th>Ngày tạo</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th></tr></thead><tbody>${rows.map(o => `<tr><td>#${o.id}</td><td>${new Date(o.created_at).toLocaleString('vi-VN')}</td><td>${money(o.total)}</td><td>${esc(o.payment_method)}</td><td>${esc(o.status)}</td></tr>`).join('')}</tbody></table></div>` : '<p>Bạn chưa có đơn hàng.</p>'); }
  catch (e) { $('content').innerHTML = `<h2>Đơn hàng</h2><p>${e.message}</p>`; }
}
async function showAdmin() {
  if (!user || user.role !== 'admin') { showAuth('login'); return; }
  $('productsSection').classList.add('hidden'); $('content').classList.remove('hidden');
  try {
    const [stats, rows, orders] = await Promise.all([api('/api/admin/stats'), api('/api/admin/products'), api('/api/admin/orders')]);
    $('content').innerHTML = `<h2>Quản trị cửa hàng <span class="pill">ADMIN</span></h2><div class="stats"><div class="stat"><b>${stats.products}</b><span>Sản phẩm</span></div><div class="stat"><b>${stats.orders}</b><span>Đơn hàng</span></div><div class="stat"><b>${stats.customers}</b><span>Khách hàng</span></div></div>
 <h3>Thêm sản phẩm</h3><form id="productForm"><div class="form-grid">
 <label class="field">Tên sản phẩm<input name="name" required></label><label class="field">Danh mục<input name="category" required placeholder="Phần mềm / Game"></label>
 <label class="field">Thương hiệu<input name="brand"></label><label class="field">Giá (VNĐ)<input name="price" type="number" min="0" required></label>
 <label class="field">Tồn kho<input name="stock" type="number" min="0" required></label><label class="field">Link ảnh<input name="image" placeholder="https://..."></label>
 <label class="field full">Mô tả<textarea name="description" rows="2"></textarea></label></div><div class="form-actions"><button class="btn">Thêm sản phẩm</button><span id="adminMsg" class="message"></span></div></form>
 <h3>Quản lý sản phẩm</h3><div class="table-wrap"><table><thead><tr><th>ID</th><th>Sản phẩm</th><th>Giá</th><th>Tồn kho</th><th>Thao tác</th></tr></thead><tbody>${rows.map(p => `<tr><td>${p.id}</td><td>${esc(p.name)}</td><td>${money(p.price)}</td><td>${p.stock}</td><td><button class="btn danger" onclick="deleteProduct(${p.id})">Xóa</button></td></tr>`).join('')}</tbody></table></div>
 <h3>Đơn hàng mới nhất</h3><div class="table-wrap"><table><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead><tbody>${orders.map(o => `<tr><td>#${o.id}</td><td>${esc(o.customer_name)}</td><td>${money(o.total)}</td><td>${esc(o.status)}</td></tr>`).join('') || '<tr><td colspan="4">Chưa có đơn hàng</td></tr>'}</tbody></table></div>`;
    $('productForm').onsubmit = async e => { e.preventDefault(); const body = Object.fromEntries(new FormData(e.target).entries()); try { await api('/api/admin/products', { method: 'POST', body: JSON.stringify(body) }); showAdmin(); } catch (err) { $('adminMsg').textContent = err.message; } };
  } catch (e) { $('content').innerHTML = `<h2>Quản trị</h2><p>${e.message}</p>`; }
}
async function deleteProduct(id) { if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return; try { await api('/api/admin/products/' + id, { method: 'DELETE' }); showAdmin(); } catch (e) { alert(e.message); } }
$('searchForm').addEventListener('submit', e => { e.preventDefault(); loadProducts(); });
$('categoryFilter').addEventListener('change', loadProducts);
$('sortFilter').addEventListener('change', loadProducts);
(async function init() { updateCartCount(); await loadMe(); await loadCategories(); await loadProducts(); })();
