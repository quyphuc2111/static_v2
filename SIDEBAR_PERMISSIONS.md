# Sidebar Permissions by Role

## 📋 **Sidebar Menu Items theo Role**

### 🔴 **ADMINISTRATOR** (Tất cả menu)
- ✅ **Dashboard** - `VIEW_DASHBOARD_STATS`
- ✅ **Quản lý Dự án** - `VIEW_PROJECTS`
- ✅ **Quản lý Nội dung** - `VIEW_CONTENT`
- ✅ **Quản lý Người dùng** - `VIEW_USERS`
- ✅ **Quản lý Quyền hạn** - `MANAGE_USER_PERMISSIONS`
- ✅ **Chia sẻ Nội dung** - `SHARE_CONTENT_ACCESS`

### 🔵 **DEV** (Menu hạn chế)
- ✅ **Dashboard** - `VIEW_DASHBOARD_STATS` (luôn hiển thị)
- ✅ **Quản lý Dự án** - `VIEW_PROJECTS`
- ✅ **Quản lý Nội dung** - `VIEW_CONTENT`
- ✅ **Quản lý Người dùng** - `VIEW_USERS`
- ❌ **Quản lý Quyền hạn** - `MANAGE_USER_PERMISSIONS` (không có quyền)
- ❌ **Chia sẻ Nội dung** - `SHARE_CONTENT_ACCESS` (không có quyền)

### 🟢 **TESTER** (Menu tối thiểu)
- ✅ **Dashboard** - `VIEW_DASHBOARD_STATS` (luôn hiển thị)
- ❌ **Quản lý Dự án** - `VIEW_PROJECTS` (không có quyền)
- ❌ **Quản lý Nội dung** - `VIEW_CONTENT` (không có quyền)
- ❌ **Quản lý Người dùng** - `VIEW_USERS` (không có quyền)
- ❌ **Quản lý Quyền hạn** - `MANAGE_USER_PERMISSIONS` (không có quyền)
- ❌ **Chia sẻ Nội dung** - `SHARE_CONTENT_ACCESS` (không có quyền)

## 🔧 **Cách hoạt động**

### **Permission Mapping:**
```typescript
const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    permission: "VIEW_DASHBOARD_STATS"
  },
  {
    name: "Quản lý Dự án",
    href: "/project", 
    icon: Settings,
    permission: "VIEW_PROJECTS"
  },
  // ... các menu khác
]
```

### **Filtering Logic:**
```typescript
const filteredNavigation = navigation.filter(item => {
  // Dashboard luôn hiển thị
  if (item.href === "/") return true
  // Kiểm tra permission cho các menu khác
  return hasPermission(item.permission)
})
```

### **Dynamic Rendering:**
- Sidebar sẽ tự động ẩn/hiện menu items dựa trên role của user
- User chỉ thấy các menu mà họ có quyền truy cập
- Dashboard luôn hiển thị cho tất cả users

## 🎯 **Kết quả**

**ADMIN**: Thấy tất cả 6 menu items
**DEV**: Thấy 4 menu items (Dashboard, Dự án, Nội dung, Người dùng)
**TESTER**: Chỉ thấy 1 menu item (Dashboard)

**Sidebar sẽ tự động điều chỉnh theo role của user đang đăng nhập!** 🎉


