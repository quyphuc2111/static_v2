# 📋 Hướng dẫn Permissions - Đã Chuẩn Hóa

## 🎯 Tổng quan

Hệ thống permissions đã được chuẩn hóa theo nguyên tắc **CRUD** (Create, Read, Update, Delete) nhất quán cho tất cả entities.

## 📊 Tổng số: 28 Permissions

---

## 🗂️ Content Management (10 permissions)

### CRUD Operations
| Permission | Mô tả | Use Case |
|------------|-------|----------|
| `VIEW_CONTENT` | Xem nội dung | Đọc, xem preview content |
| `CREATE_CONTENT` | Tạo nội dung mới | Upload files, tạo SCORM |
| `EDIT_CONTENT` | Chỉnh sửa nội dung | Cập nhật title, description |
| `SOFT_DELETE_CONTENT` | Xóa mềm (có thể khôi phục) | Đánh dấu `isDeleted = true` |
| `HARD_DELETE_CONTENT` | Xóa vĩnh viễn | Xóa database + files |

### Content Scope
| Permission | Mô tả | Use Case |
|------------|-------|----------|
| `MANAGE_ALL_CONTENT` | Quản lý ALL content | Admin, Manager - bỏ qua ownership |
| `MANAGE_OWN_CONTENT` | Chỉ quản lý content của mình | Developer - chỉ edit/delete own content |
| `VIEW_OWN_CONTENT_ONLY` | Chỉ xem content của mình | Restricted user |

### Content Sharing
| Permission | Mô tả | Use Case |
|------------|-------|----------|
| `VIEW_SHARED_CONTENT` | Xem content được share | Tester, collaborators |
| `SHARE_CONTENT_ACCESS` | Chia sẻ content cho others | Content owner |

---

## 📁 Project Management (5 permissions)

### CRUD Operations
| Permission | Mô tả |
|------------|-------|
| `VIEW_PROJECTS` | Xem danh sách projects |
| `CREATE_PROJECTS` | Tạo project mới |
| `EDIT_PROJECTS` | Chỉnh sửa project |
| `SOFT_DELETE_PROJECTS` | Xóa mềm project |
| `HARD_DELETE_PROJECTS` | Xóa vĩnh viễn project + modules + content |

---

## 📦 Module Management (5 permissions)

### CRUD Operations
| Permission | Mô tả |
|------------|-------|
| `VIEW_MODULES` | Xem modules trong project |
| `CREATE_MODULES` | Tạo module mới |
| `EDIT_MODULES` | Chỉnh sửa module |
| `SOFT_DELETE_MODULES` | Xóa mềm module |
| `HARD_DELETE_MODULES` | Xóa vĩnh viễn module + content |

---

## 👥 User Management (6 permissions)

### CRUD Operations
| Permission | Mô tả |
|------------|-------|
| `VIEW_USERS` | Xem danh sách users |
| `CREATE_USERS` | Tạo user mới |
| `EDIT_USERS` | Chỉnh sửa thông tin user |
| `SOFT_DELETE_USERS` | Vô hiệu hóa user (status = DISABLED) |
| `HARD_DELETE_USERS` | Xóa vĩnh viễn user khỏi database |
| `MANAGE_USER_PERMISSIONS` | Quản lý roles & permissions |

---

## 📊 Audit & Dashboard (2 permissions)

| Permission | Mô tả |
|------------|-------|
| `VIEW_AUDIT_LOGS` | Xem audit logs |
| `VIEW_DASHBOARD_STATS` | Xem dashboard statistics |

---

## 🎭 Vai trò mẫu (Role Templates)

### ADMINISTRATOR (28 permissions)
- **Tất cả** permissions
- Full control của hệ thống

### DEV - Developer (11 permissions)
```
✅ Content: VIEW, CREATE, EDIT, SOFT_DELETE
✅ Scope: MANAGE_OWN_CONTENT, VIEW_OWN_CONTENT_ONLY
✅ Projects: VIEW, CREATE
✅ Modules: VIEW, CREATE
✅ Users: VIEW
```

**Use Case:** Developer có thể tạo và quản lý content của chính mình, nhưng không thể hard delete hoặc quản lý content của người khác.

### TESTER (3 permissions)
```
✅ VIEW_SHARED_CONTENT
✅ VIEW_PROJECTS
✅ VIEW_MODULES
```

**Use Case:** Tester chỉ có thể xem content được share, không thể tạo hoặc xóa.

---

## 🔑 Nguyên tắc Phân quyền

### 1. **Soft Delete vs Hard Delete**
- **Soft Delete:** Đánh dấu `isDeleted = true`, có thể khôi phục
- **Hard Delete:** Xóa khỏi database + files, **KHÔNG** thể khôi phục
- **Best Practice:** Chỉ ADMIN hoặc Manager mới nên có HARD_DELETE

### 2. **Ownership & Scope**
- `MANAGE_OWN_CONTENT`: User chỉ thao tác trên content mình tạo
- `MANAGE_ALL_CONTENT`: Bỏ qua ownership, quản lý tất cả
- `VIEW_OWN_CONTENT_ONLY`: Bị restrict, chỉ thấy own content

### 3. **Permission Hierarchy**
```
HARD_DELETE > SOFT_DELETE > EDIT > CREATE > VIEW
MANAGE_ALL > MANAGE_OWN
```

### 4. **Sharing Override**
- User có `SHARE_CONTENT_ACCESS` có thể share content cho others
- Người được share có thể có `canView`, `canEdit`, `canDelete` tùy theo permission được grant

---

## 🚀 Migration từ Permissions Cũ

| Old Permission | ➡️ New Permissions |
|----------------|-------------------|
| `DELETE_CONTENT` | `SOFT_DELETE_CONTENT` + `HARD_DELETE_CONTENT` |
| `DELETE_PROJECTS` | `SOFT_DELETE_PROJECTS` + `HARD_DELETE_PROJECTS` |
| `DELETE_MODULES` | `SOFT_DELETE_MODULES` + `HARD_DELETE_MODULES` |
| `DELETE_USERS` | `SOFT_DELETE_USERS` + `HARD_DELETE_USERS` |
| `VIEW_SHARED_CONTENT_ONLY` | ❌ Removed (use `VIEW_SHARED_CONTENT`) |

---

## 💡 Examples

### Example 1: Content Editor Role
```javascript
{
  name: "Content Editor",
  permissions: [
    "VIEW_CONTENT",
    "CREATE_CONTENT",
    "EDIT_CONTENT",
    "SOFT_DELETE_CONTENT", // Có thể xóa mềm
    "VIEW_PROJECTS"
  ]
}
```

### Example 2: Content Manager Role
```javascript
{
  name: "Content Manager",
  permissions: [
    "VIEW_CONTENT",
    "CREATE_CONTENT",
    "EDIT_CONTENT",
    "SOFT_DELETE_CONTENT",
    "HARD_DELETE_CONTENT",  // Có thể xóa vĩnh viễn
    "MANAGE_ALL_CONTENT",   // Quản lý tất cả content
    "SHARE_CONTENT_ACCESS", // Có thể share
    "VIEW_PROJECTS",
    "VIEW_MODULES"
  ]
}
```

### Example 3: Project Admin Role
```javascript
{
  name: "Project Admin",
  permissions: [
    "VIEW_PROJECTS",
    "CREATE_PROJECTS",
    "EDIT_PROJECTS",
    "SOFT_DELETE_PROJECTS",
    "VIEW_MODULES",
    "CREATE_MODULES",
    "EDIT_MODULES",
    "SOFT_DELETE_MODULES"
  ]
}
```

---

## 📝 Notes

1. **CREATE_CONTENT** permission là bắt buộc để upload content
2. **MANAGE_ALL_CONTENT** override ownership check - dùng cho Admin/Manager
3. **HARD_DELETE** permissions nên cấp cẩn thận - không thể undo
4. Soft delete vẫn giữ data, có thể implement "Restore" feature sau này
5. Tester role không có quyền tạo/sửa/xóa - chỉ xem content được share

---

## 🔄 Cách Seed Lại Permissions

```bash
node seed-rbac.js
```

Script sẽ:
1. Tạo tất cả 28 permissions
2. Tạo 3 roles mẫu (ADMINISTRATOR, DEV, TESTER)
3. Assign permissions tương ứng cho mỗi role

