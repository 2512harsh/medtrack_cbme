import type { Notification, AuditLog, UserRole } from "@/types";
import {
  mockNotifications,
  mockAuditLogs,
  mockStatusTransitions,
  mockRemediationWorkflow,
  type RoleScopedNotification,
} from "@/features/assessment/mock/assessment";

export function getNotifications(): Promise<Notification[]> {
  return Promise.resolve(mockNotifications);
}

export function getNotificationsForRole(role: UserRole): Promise<RoleScopedNotification[]> {
  const scoped = mockNotifications.filter((n) => n.roles.includes(role));
  if (scoped.length > 0) return Promise.resolve(scoped);
  if (role === "Super Admin") return Promise.resolve([...mockNotifications]);
  return Promise.resolve([]);
}

export function getAuditLogs(): Promise<AuditLog[]> {
  return Promise.resolve(mockAuditLogs);
}

export function getStatusTransitions(): Promise<typeof mockStatusTransitions> {
  return Promise.resolve(mockStatusTransitions);
}

export function getRemediationWorkflow(): Promise<typeof mockRemediationWorkflow> {
  return Promise.resolve(mockRemediationWorkflow);
}

export function markNotificationAsRead(id: string): Promise<RoleScopedNotification> {
  const index = mockNotifications.findIndex((n) => n.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Notification not found"));
  }
  mockNotifications[index] = { ...mockNotifications[index], read: true };
  return Promise.resolve(mockNotifications[index]);
}

export function markAllNotificationsAsRead(): Promise<RoleScopedNotification[]> {
  mockNotifications.forEach((n) => {
    n.read = true;
  });
  return Promise.resolve(mockNotifications);
}
