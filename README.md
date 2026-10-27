# DivineShop Demo – bản SQL Server cho VS Code

Website demo học tập lấy cảm hứng từ bố cục cửa hàng kỹ thuật số. Đây không phải website DivineShop chính thức. Bản này dùng **Microsoft SQL Server + Node.js**, giữ giao diện HTML/CSS/JavaScript và các chức năng của bản trước.

## 1. Cài phần mềm
- **Node.js LTS**: https://nodejs.org/
- **SQL Server** (Express/Developer hoặc phiên bản đang có) và **SQL Server Management Studio (SSMS)**.
- **VS Code**.

> Trong SSMS chọn **SQL Server Authentication** khi kết nối. Nếu tài khoản SQL chưa dùng được, xem phần 3 bên dưới.

## 2. Tạo database và bảng
1. Mở SSMS, kết nối tới đúng SQL Server instance của bạn.
2. Chọn **New Query**.
3. Mở file `database.sql`, sao chép toàn bộ nội dung vào cửa sổ query mới (hoặc mở trực tiếp file từ SSMS).
4. Nhấn **Execute**. File sẽ tạo database `divineshop_demo`, các bảng và 10 sản phẩm mẫu.
5. Làm mới mục **Databases** trong Object Explorer, kiểm tra có `divineshop_demo`.

## 3. Tạo tài khoản SQL Server để Node.js kết nối
Nếu bạn đã có SQL Login có quyền đọc/ghi database, dùng tài khoản đó ở bước 4. Nếu chưa có, đăng nhập SSMS bằng tài khoản quản trị và làm như sau:

1. Bật SQL Server Authentication (Mixed Mode) nếu hiện tại chỉ dùng Windows Authentication: nhấn phải tên server → **Properties** → **Security** → chọn **SQL Server and Windows Authentication mode** → OK, rồi restart SQL Server service.
2. Mở **Security → Logins → New Login...**.
3. Chọn **SQL Server authentication**, nhập login (ví dụ `divineshop_user`) và mật khẩu do bạn tự đặt. Bỏ chọn yêu cầu đổi mật khẩu nếu phù hợp môi trường học tập.
4. Trong **User Mapping**, tích database `divineshop_demo`; cấp quyền `db_datareader` và `db_datawriter`. Để chạy script tạo admin, các quyền này đủ sau khi schema đã được tạo.
5. Nhấn OK.

Nếu instance của bạn dùng SQL Server Express, tên server thường là `localhost\SQLEXPRESS` hoặc `TEN-MAY\SQLEXPRESS`. Nếu dùng default instance, có thể là `localhost`. Dùng đúng tên đang hiển thị trong SSMS. Nếu bật TCP/IP hoặc đổi cổng, kiểm tra SQL Server Configuration Manager và firewall.

## 4. Cấu hình Node.js
1. Giải nén ZIP.
2. Trong VS Code, mở thư mục `DivineShop_SQLServer`.
3. Sao chép `.env.example`, đổi tên bản sao thành `.env`.
4. Sửa các giá trị trong `.env`, ví dụ:

```env
PORT=3000
DB_SERVER=localhost\SQLEXPRESS
DB_NAME=divineshop_demo
DB_USER=divineshop_user
DB_PASSWORD=MatKhauBanDaDat
DB_ENCRYPT=false
DB_TRUST_CERT=true
SESSION_SECRET=doi-chuoi-nay-thanh-chuoi-rieng-cua-ban
```

- `DB_SERVER`: tên server/instance trong SSMS; trong file `.env`, dùng `localhost\SQLEXPRESS` nếu là SQL Server Express.
- `DB_USER` và `DB_PASSWORD`: SQL Login bạn vừa tạo. Không phải tài khoản đăng nhập website.
- `DB_ENCRYPT=false` và `DB_TRUST_CERT=true` phù hợp phần lớn môi trường local để học. Môi trường triển khai thật cần cấu hình TLS đúng.
- Không đặt dấu nháy quanh giá trị và không chia sẻ file `.env`.

## 5. Cài và chạy website
Mở Terminal trong VS Code, đảm bảo đang ở thư mục có `package.json`, rồi chạy:

```bash
npm install
node create-admin.js
npm start
```

Mở trình duyệt tại **http://localhost:3000**.

Tài khoản quản trị demo: `admin@demo.local` / `Admin@123`. Đổi mật khẩu nếu tiếp tục sử dụng lâu dài. Khách hàng có thể tự đăng ký trên website.

## 6. Nếu không kết nối được
- **Login failed for user**: kiểm tra `DB_USER`, `DB_PASSWORD`, bật SQL Server Authentication và xác nhận login có quyền vào database.
- **Server not found / connect ECONNREFUSED**: kiểm tra tên `DB_SERVER`, SQL Server service đang chạy, và instance/cổng kết nối.
- **Cannot open database**: chạy `database.sql` trước và kiểm tra tên database chính xác.
- **Certificate / encryption error**: trên máy học local có thể thử `DB_ENCRYPT=false` và `DB_TRUST_CERT=true`.
- Nếu sửa `.env`, dừng server bằng `Ctrl+C` rồi chạy lại `npm start`.

## 7. Chức năng
- Tìm kiếm theo tên/thương hiệu, lọc danh mục, sắp xếp giá.
- Xem chi tiết sản phẩm, giỏ hàng, đăng ký/đăng nhập/đăng xuất.
- Đặt hàng, xem đơn hàng của khách, mã giảm giá.
- Admin xem thống kê, thêm/xóa sản phẩm, xem đơn hàng.
- Thông tin sản phẩm, tài khoản, đơn hàng được lưu trong SQL Server; giỏ hàng demo lưu trong `localStorage`.

## 8. Lỗi cố ý cho bài kiểm thử
- **D001**: server chưa kiểm tra họ tên rỗng khi đăng ký.
- **D002**: không khóa tài khoản sau 5 lần đăng nhập sai.
- **D003**: chưa chặn số lượng đặt vượt tồn kho.
- **D004**: mã `SALE2025` đã hết hạn vẫn được chấp nhận.

Đây là lỗi cố ý trong demo kiểm thử, không nên áp dụng cho website thật. Website cũng chưa tích hợp thanh toán thật, email thật, CSRF/rate-limit hoặc cấu hình triển khai production.
