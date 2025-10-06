# Hướng dẫn tích hợp MySQL MCP vào dự án Static Content Server

## Tổng quan

Dự án này sử dụng MySQL MCP server để tương tác với database Prisma trực tiếp từ Cursor IDE.

## Cấu hình

### 1. Cấu hình Cursor

Đã tạo file `.cursor-mcp-config.json` với cấu hình MCP server:

```json
{
  "mcpServers": {
    "mysql-static-content": {
      "command": "node",
      "args": ["server.js"],
      "cwd": "/Users/zenadev/OutSource/mysql-mcp",
      "env": {
        "DATABASE_URL": "mysql://appuser:apppass@127.0.0.1:3306/appdb"
      }
    }
  }
}
```

### 2. Cấu hình Database

Tạo file `.env` từ `env.example`:

```bash
cp env.example .env
```

Cập nhật `DATABASE_URL` trong file `.env`:

```env
DATABASE_URL="mysql://your_username:your_password@localhost:3306/your_database"
```

## Các tools có sẵn

### 1. Tools cơ bản
- `query` - Thực thi SQL query tùy chỉnh
- `describe_table` - Mô tả cấu trúc bảng
- `list_tables` - Liệt kê tất cả bảng
- `show_databases` - Hiển thị databases
- `show_create_table` - Hiển thị CREATE TABLE statement

### 2. Tools chuyên biệt cho Prisma
- `prisma_tables` - Liệt kê tất cả bảng Prisma với thông tin chi tiết
- `user_stats` - Thống kê người dùng
- `content_stats` - Thống kê nội dung
- `project_stats` - Thống kê dự án và module
- `rbac_stats` - Thống kê RBAC (roles, permissions)
- `audit_logs` - Xem audit logs gần đây

## Cách sử dụng trong Cursor

### 1. Kiểm tra cấu trúc database
```
Hãy chạy prisma_tables để xem tất cả bảng trong database
```

### 2. Thống kê người dùng
```
Hiển thị thống kê người dùng trong hệ thống
```

### 3. Thống kê nội dung
```
Hiển thị thống kê nội dung SCORM và HTML
```

### 4. Kiểm tra RBAC
```
Hiển thị thống kê roles và permissions
```

### 5. Xem audit logs
```
Hiển thị 20 audit logs gần đây nhất
```

### 6. Query tùy chỉnh
```
Chạy query: SELECT u.name, u.email, r.name as role_name 
FROM User u 
JOIN UserRole ur ON u.id = ur.userId 
JOIN Role r ON ur.roleId = r.id 
LIMIT 10
```

## Cấu trúc Database

Dự án sử dụng các bảng chính:

- **User** - Quản lý người dùng
- **ContentData** - Quản lý nội dung SCORM/HTML
- **Project** - Quản lý dự án
- **Module** - Quản lý module trong dự án
- **Role** - Quản lý vai trò
- **Permission** - Quản lý quyền
- **ContentShare** - Chia sẻ nội dung
- **AuditLog** - Log hoạt động

## Troubleshooting

### Lỗi kết nối database
1. Kiểm tra MySQL server đang chạy
2. Kiểm tra `DATABASE_URL` trong `.env`
3. Kiểm tra quyền truy cập database

### Lỗi MCP server
1. Kiểm tra đường dẫn trong `.cursor-mcp-config.json`
2. Đảm bảo đã cài đặt dependencies: `npm install`
3. Kiểm tra logs trong Cursor console

### Lỗi Prisma
1. Chạy `npx prisma generate` để tạo Prisma client
2. Chạy `npx prisma db push` để đồng bộ schema
3. Chạy `npx prisma db seed` để seed dữ liệu mẫu

## Phát triển

### Chạy development server
```bash
npm run dev
```

### Chạy Prisma commands
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

### Chạy MySQL MCP server riêng
```bash
cd /Users/zenadev/OutSource/mysql-mcp
node prisma-mysql-server.js
```

## Lưu ý

- MCP server sử dụng cùng `DATABASE_URL` với Prisma
- Tất cả queries đều được thực thi trực tiếp trên MySQL
- Có thể sử dụng kết hợp với Prisma ORM trong code
- Audit logs được tự động ghi lại các hoạt động quan trọng
