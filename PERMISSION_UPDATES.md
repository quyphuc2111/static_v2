# Permission System Updates

## Tóm tắt thay đổi

Hệ thống phân quyền đã được cập nhật với các tính năng mới:

### 1. Schema Changes

#### Permission Model
- **Thêm field `nameVi`**: Tên tiếng Việt cho mỗi permission
- Giúp hiển thị UI thân thiện hơn với người dùng Việt Nam

#### New Permissions Added

**Content Management:**
- `VIEW_DELETED_CONTENT` - Xem nội dung đã xóa
- `RESTORE_CONTENT` - Khôi phục nội dung đã xóa

**Project Management:**
- `VIEW_DELETED_PROJECTS` - Xem dự án đã xóa
- `RESTORE_PROJECTS` - Khôi phục dự án đã xóa

**Module Management:**
- `VIEW_DELETED_MODULES` - Xem module đã xóa
- `RESTORE_MODULES` - Khôi phục module đã xóa

### 2. Database Updates

File seed đã được cập nhật (`seed-rbac.js`):
- Tất cả 35 permissions đã có tên tiếng Việt
- Administrator role có full permissions
- Developer role có permissions cho own content + view/create
- Tester role có permissions để view shared content

### 3. API Changes

API `/api/permissions` tự động trả về field `nameVi` mới

### 4. TypeScript Interface Updates

File `src/modules/rbac/rbac.interface.ts`:
```typescript
export interface Permission {
  id: string
  name: string
  nameVi?: string  // New field
  description?: string
  createdAt: string
  updatedAt: string
}
```

### 5. UI Updates

#### Permissions Matrix Component
File `src/components/rbac/permissions-matrix.tsx`:
- Hiển thị tên tiếng Việt ở dòng đầu
- Hiển thị permission name (tiếng Anh) dưới dạng code badge
- Giao diện đã được redesign với:
  - Collapsible groups
  - Role icons và colors
  - Search với debounce
  - Loading states

### 6. Permission Constants

File mới `src/constants/permissions.ts`:
- Định nghĩa tất cả permissions dưới dạng constants
- Grouping theo resource (Content, Project, Module, User, Audit)
- Helper function `getResourcePermissions()`

### 7. Permission Guard

Component `PermissionGuard` đã tồn tại và hoạt động tốt:
- Hỗ trợ single permission hoặc multiple permissions
- Hỗ trợ role-based access
- Có fallback UI khi không có quyền

## Cách sử dụng

### 1. Sử dụng PermissionGuard trong Component

```tsx
import { PermissionGuard } from "@/components/rbac/permission-guard"
import { PermissionName } from "@prisma/client"

// Single permission
<PermissionGuard permission={PermissionName.CREATE_CONTENT}>
  <Button>Tạo nội dung</Button>
</PermissionGuard>

// Multiple permissions (any)
<PermissionGuard permissions={[
  PermissionName.VIEW_DELETED_CONTENT,
  PermissionName.RESTORE_CONTENT
]}>
  <Button>Xem đã xóa</Button>
</PermissionGuard>

// Multiple permissions (require all)
<PermissionGuard 
  permissions={[
    PermissionName.EDIT_CONTENT,
    PermissionName.MANAGE_ALL_CONTENT
  ]} 
  requireAll={true}
>
  <Button>Chỉnh sửa tất cả</Button>
</PermissionGuard>
```

### 2. Sử dụng Permission Constants

```tsx
import { Permissions } from "@/constants/permissions"

<PermissionGuard permission={Permissions.Content.VIEW_DELETED}>
  <RestoreButton />
</PermissionGuard>
```

### 3. Hiển thị tên tiếng Việt

```tsx
const permission = { name: "CREATE_CONTENT", nameVi: "Tạo nội dung" }

// Hiển thị tên tiếng Việt, fallback to English name
<span>{permission.nameVi || permission.name}</span>
```

## Migration & Seeding

### Chạy migration
```bash
npx prisma db push
npx prisma generate
```

### Seed permissions mới
```bash
node seed-rbac.js
```

## Files Changed

1. `prisma/schema.prisma` - Schema updates
2. `seed-rbac.js` - Seed data with Vietnamese names
3. `src/modules/rbac/rbac.interface.ts` - TypeScript interface
4. `src/components/rbac/permissions-matrix.tsx` - UI redesign
5. `src/constants/permissions.ts` - New constants file

## Notes

- PermissionGuard component đã tồn tại và được sử dụng rộng rãi trong:
  - User management
  - Content management
  - Project management
  - Role management
  - Content sharing

- Tất cả UI components đã sử dụng PermissionGuard đúng cách
- API tự động trả về nameVi không cần thay đổi
