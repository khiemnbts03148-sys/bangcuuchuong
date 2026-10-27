/* DivineShop demo - SQL Server (chay trong SSMS) */
IF DB_ID(N'divineshop_demo') IS NULL
    CREATE DATABASE divineshop_demo;
GO
USE divineshop_demo;
GO

IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        email NVARCHAR(150) NOT NULL UNIQUE,
        phone NVARCHAR(20) NULL,
        password_hash NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) NOT NULL CONSTRAINT DF_users_role DEFAULT N'customer' CHECK (role IN (N'customer',N'admin')),
        failed_attempts INT NOT NULL CONSTRAINT DF_users_failed DEFAULT 0,
        locked_until DATETIME2 NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created DEFAULT SYSDATETIME()
    );
END;
GO
IF OBJECT_ID(N'dbo.products', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.products (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(180) NOT NULL,
        category NVARCHAR(80) NOT NULL,
        brand NVARCHAR(80) NULL CONSTRAINT DF_products_brand DEFAULT N'',
        description NVARCHAR(MAX) NULL,
        price DECIMAL(12,0) NOT NULL CONSTRAINT DF_products_price DEFAULT 0,
        stock INT NOT NULL CONSTRAINT DF_products_stock DEFAULT 0,
        image NVARCHAR(500) NULL,
        active BIT NOT NULL CONSTRAINT DF_products_active DEFAULT 1,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_products_created DEFAULT SYSDATETIME()
    );
END;
GO
IF OBJECT_ID(N'dbo.orders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.orders (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        customer_name NVARCHAR(100) NOT NULL,
        phone NVARCHAR(20) NOT NULL,
        address NVARCHAR(255) NOT NULL,
        payment_method NVARCHAR(30) NOT NULL CONSTRAINT DF_orders_payment DEFAULT N'COD',
        total DECIMAL(12,0) NOT NULL,
        status NVARCHAR(30) NOT NULL CONSTRAINT DF_orders_status DEFAULT N'Đang xử lý',
        created_at DATETIME2 NOT NULL CONSTRAINT DF_orders_created DEFAULT SYSDATETIME(),
        CONSTRAINT FK_orders_users FOREIGN KEY (user_id) REFERENCES dbo.users(id)
    );
END;
GO
IF OBJECT_ID(N'dbo.order_items', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.order_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name NVARCHAR(180) NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(12,0) NOT NULL,
        CONSTRAINT FK_order_items_orders FOREIGN KEY (order_id) REFERENCES dbo.orders(id) ON DELETE CASCADE
    );
END;
GO
IF OBJECT_ID(N'dbo.coupons', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.coupons (
        id INT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(30) NOT NULL UNIQUE,
        percent_off INT NOT NULL,
        expires_at DATE NOT NULL,
        active BIT NOT NULL CONSTRAINT DF_coupons_active DEFAULT 1
    );
END;
GO

/* Them du lieu mau neu chua ton tai */
IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE name=N'Windows 11 Pro')
INSERT INTO dbo.products(name,category,brand,description,price,stock,image) VALUES
(N'Windows 11 Pro',N'Phần mềm',N'Microsoft',N'Bản quyền hệ điều hành dành cho máy tính cá nhân.',1290000,30,N'https://images.unsplash.com/photo-1624571409108-e9a2a1c5f5a0?auto=format&fit=crop&w=700&q=80');
IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE name=N'Microsoft Office 2024')
INSERT INTO dbo.products(name,category,brand,description,price,stock,image) VALUES
(N'Microsoft Office 2024',N'Phần mềm văn phòng',N'Microsoft',N'Bộ ứng dụng văn phòng cho học tập và công việc.',2190000,25,N'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=700&q=80');
IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE name=N'Steam Wallet 500K')
INSERT INTO dbo.products(name,category,brand,description,price,stock,image) VALUES
(N'Steam Wallet 500K',N'Thẻ game',N'Steam',N'Mã nạp ví Steam dùng mua trò chơi.',500000,100,N'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=700&q=80');
IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE name=N'Xbox Game Pass 3 tháng')
INSERT INTO dbo.products(name,category,brand,description,price,stock,image) VALUES
(N'Xbox Game Pass 3 tháng',N'Gói thành viên',N'Xbox',N'Gói thành viên chơi game theo thư viện.',399000,40,N'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=700&q=80');
IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE name=N'Adobe Creative Cloud')
INSERT INTO dbo.products(name,category,brand,description,price,stock,image) VALUES
(N'Adobe Creative Cloud',N'Phần mềm sáng tạo',N'Adobe',N'Bộ công cụ thiết kế và sáng tạo nội dung.',899000,15,N'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=700&q=80');
IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE name=N'Spotify Premium 1 tháng')
INSERT INTO dbo.products(name,category,brand,description,price,stock,image) VALUES
(N'Spotify Premium 1 tháng',N'Giải trí',N'Spotify',N'Gói nghe nhạc không quảng cáo.',69000,80,N'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=700&q=80');
IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE name=N'Minecraft Java Edition')
INSERT INTO dbo.products(name,category,brand,description,price,stock,image) VALUES
(N'Minecraft Java Edition',N'Game',N'Mojang',N'Trò chơi sandbox xây dựng và khám phá.',690000,20,N'https://images.unsplash.com/photo-1607513746994-51f730a44832?auto=format&fit=crop&w=700&q=80');
IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE name=N'PlayStation Plus 1 tháng')
INSERT INTO dbo.products(name,category,brand,description,price,stock,image) VALUES
(N'PlayStation Plus 1 tháng',N'Gói thành viên',N'PlayStation',N'Gói thành viên cho hệ sinh thái PlayStation.',179000,35,N'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=700&q=80');
IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE name=N'Kaspersky Standard')
INSERT INTO dbo.products(name,category,brand,description,price,stock,image) VALUES
(N'Kaspersky Standard',N'Phần mềm bảo mật',N'Kaspersky',N'Phần mềm bảo vệ thiết bị cá nhân.',199000,50,N'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=700&q=80');
IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE name=N'Discord Nitro 1 tháng')
INSERT INTO dbo.products(name,category,brand,description,price,stock,image) VALUES
(N'Discord Nitro 1 tháng',N'Gói thành viên',N'Discord',N'Gói nâng cấp trải nghiệm Discord.',229000,25,N'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&w=700&q=80');
IF NOT EXISTS (SELECT 1 FROM dbo.coupons WHERE code=N'WELCOME10')
INSERT INTO dbo.coupons(code,percent_off,expires_at,active) VALUES(N'WELCOME10',10,'2099-12-31',1);
IF NOT EXISTS (SELECT 1 FROM dbo.coupons WHERE code=N'SALE2025')
INSERT INTO dbo.coupons(code,percent_off,expires_at,active) VALUES(N'SALE2025',20,'2025-12-31',1);
GO

SELECT *
FROM dbo.products;
SELECT
    id,
    name,
    email,
    phone,
    role,
    created_at
FROM dbo.users;

SELECT
    id,
    name,
    email,
    phone,
    role,
    created_at
FROM dbo.users
WHERE role = 'customer'
ORDER BY created_at DESC;