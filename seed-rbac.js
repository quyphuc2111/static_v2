const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedRBAC() {
  console.log('🌱 Seeding RBAC data...')

  try {
    // Create permissions based on schema
    const permissions = [
      // Content Management - CRUD
      { name: 'VIEW_CONTENT', description: 'Xem nội dung' },
      { name: 'CREATE_CONTENT', description: 'Tạo nội dung mới' },
      { name: 'EDIT_CONTENT', description: 'Chỉnh sửa nội dung' },
      { name: 'SOFT_DELETE_CONTENT', description: 'Xóa mềm nội dung (có thể khôi phục)' },
      { name: 'HARD_DELETE_CONTENT', description: 'Xóa vĩnh viễn nội dung' },
      
      // Content Scope
      { name: 'MANAGE_ALL_CONTENT', description: 'Quản lý tất cả nội dung (bỏ qua ownership)' },
      { name: 'MANAGE_OWN_CONTENT', description: 'Chỉ quản lý nội dung của chính mình' },
      { name: 'VIEW_OWN_CONTENT_ONLY', description: 'Chỉ xem nội dung của chính mình' },
      
      // Content Sharing
      { name: 'VIEW_SHARED_CONTENT', description: 'Xem nội dung được chia sẻ' },
      { name: 'SHARE_CONTENT_ACCESS', description: 'Chia sẻ quyền truy cập nội dung' },
      
      // Project Management - CRUD
      { name: 'VIEW_PROJECTS', description: 'Xem dự án' },
      { name: 'CREATE_PROJECTS', description: 'Tạo dự án mới' },
      { name: 'EDIT_PROJECTS', description: 'Chỉnh sửa dự án' },
      { name: 'SOFT_DELETE_PROJECTS', description: 'Xóa mềm dự án' },
      { name: 'HARD_DELETE_PROJECTS', description: 'Xóa vĩnh viễn dự án' },
      
      // Module Management - CRUD
      { name: 'VIEW_MODULES', description: 'Xem module' },
      { name: 'CREATE_MODULES', description: 'Tạo module mới' },
      { name: 'EDIT_MODULES', description: 'Chỉnh sửa module' },
      { name: 'SOFT_DELETE_MODULES', description: 'Xóa mềm module' },
      { name: 'HARD_DELETE_MODULES', description: 'Xóa vĩnh viễn module' },
      
      // User Management - CRUD
      { name: 'VIEW_USERS', description: 'Xem người dùng' },
      { name: 'CREATE_USERS', description: 'Tạo người dùng' },
      { name: 'EDIT_USERS', description: 'Chỉnh sửa người dùng' },
      { name: 'SOFT_DELETE_USERS', description: 'Vô hiệu hóa người dùng' },
      { name: 'HARD_DELETE_USERS', description: 'Xóa vĩnh viễn người dùng' },
      { name: 'MANAGE_USER_PERMISSIONS', description: 'Quản lý quyền và vai trò' },
      
      // Audit & Dashboard
      { name: 'VIEW_AUDIT_LOGS', description: 'Xem nhật ký kiểm toán' },
      { name: 'VIEW_DASHBOARD_STATS', description: 'Xem thống kê dashboard' }
    ]

    console.log('📝 Creating permissions...')
    for (const perm of permissions) {
      await prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm
      })
    }

    // Create roles
    console.log('👥 Creating roles...')
    
    // Administrator role
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMINISTRATOR' },
      update: {},
      create: {
        name: 'ADMINISTRATOR',
        description: 'Quản trị viên với quyền truy cập đầy đủ'
      }
    })

    // Developer role
    const devRole = await prisma.role.upsert({
      where: { name: 'DEV' },
      update: {},
      create: {
        name: 'DEV',
        description: 'Nhà phát triển với quyền truy cập kỹ thuật'
      }
    })

    // Tester role
    const testerRole = await prisma.role.upsert({
      where: { name: 'TESTER' },
      update: {},
      create: {
        name: 'TESTER',
        description: 'Người kiểm thử với quyền xem và test'
      }
    })

    // Assign permissions to roles
    console.log('🔗 Assigning permissions to roles...')
    
    // Administrator gets all permissions
    const allPermissions = await prisma.permission.findMany()
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      })
    }

    // Developer gets content and project management permissions (own content only)
    const devPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: [
            'VIEW_CONTENT', 'CREATE_CONTENT', 'EDIT_CONTENT', 'SOFT_DELETE_CONTENT',
            'MANAGE_OWN_CONTENT', 'VIEW_OWN_CONTENT_ONLY',
            'VIEW_PROJECTS', 'CREATE_PROJECTS', 
            'VIEW_MODULES', 'CREATE_MODULES',
            'VIEW_USERS'
          ]
        }
      }
    })
    for (const permission of devPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: devRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: devRole.id,
          permissionId: permission.id
        }
      })
    }

    // Tester gets view shared content permissions only
    const testerPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: [
            'VIEW_SHARED_CONTENT',
            'VIEW_PROJECTS',
            'VIEW_MODULES'
          ]
        }
      }
    })
    for (const permission of testerPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: testerRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: testerRole.id,
          permissionId: permission.id
        }
      })
    }

    console.log('✅ RBAC seeding completed!')
    console.log(`📊 Created ${permissions.length} permissions`)
    console.log(`👥 Created 3 roles: Administrator, Developer, Tester`)

  } catch (error) {
    console.error('❌ Error seeding RBAC:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
if (require.main === module) {
  seedRBAC()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}

module.exports = { seedRBAC }
