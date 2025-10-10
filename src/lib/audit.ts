import { prisma } from "@/lib/prisma"

export interface AuditLogData {
  actorId?: string
  action: string
  entityType: string
  entityId: string
  metadata?: any
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata || {}
      }
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
    // Don't throw error to avoid breaking the main operation
  }
}

// Helper functions for common actions
export async function logProjectAction(
  actorId: string | undefined,
  action: string,
  projectId: string,
  metadata?: any
) {
  await createAuditLog({
    actorId,
    action,
    entityType: 'Project',
    entityId: projectId,
    metadata
  })
}

export async function logModuleAction(
  actorId: string | undefined,
  action: string,
  moduleId: string,
  metadata?: any
) {
  await createAuditLog({
    actorId,
    action,
    entityType: 'Module',
    entityId: moduleId,
    metadata
  })
}

export async function logContentAction(
  actorId: string | undefined,
  action: string,
  contentId: string,
  metadata?: any
) {
  await createAuditLog({
    actorId,
    action,
    entityType: 'ContentData',
    entityId: contentId,
    metadata
  })
}

export async function logUserAction(
  actorId: string | undefined,
  action: string,
  userId: string,
  metadata?: any
) {
  await createAuditLog({
    actorId,
    action,
    entityType: 'User',
    entityId: userId,
    metadata
  })
}
