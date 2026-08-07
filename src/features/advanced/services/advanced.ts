import {
  mockEvidenceRecords,
  mockAttendanceSessions,
  mockLmsIntegrations,
  mockBillingSubscriptions,
  mockInvoiceHistory,
  mockBrandingConfig,
} from "../mock/advanced";

export function getEvidenceRecords() {
  return Promise.resolve(mockEvidenceRecords);
}

export function uploadEvidence(data: {
  competencyId: string;
  competencyCode: string;
  competencyTitle: string;
  fileName: string;
  fileType: string;
  description: string;
}) {
  const record = {
    id: `ev-${Date.now()}`,
    ...data,
    fileSize: "0 B",
    uploadedAt: new Date().toISOString(),
    status: "PENDING",
  };
  mockEvidenceRecords.unshift(record);
  return Promise.resolve(record);
}

export function getAttendanceSessions() {
  return Promise.resolve(mockAttendanceSessions);
}

export function createAttendanceSession(data: {
  subject: string;
  competencyCode: string;
  competencyTitle: string;
  batch: string;
  sessionTitle: string;
}) {
  const session = {
    id: `att-${Date.now()}`,
    ...data,
    startAt: new Date().toISOString(),
    qrActive: true,
    presentCount: 0,
    totalStudents: 0,
  };
  mockAttendanceSessions.unshift(session);
  return Promise.resolve(session);
}

export function toggleQrActive(id: string) {
  const index = mockAttendanceSessions.findIndex((s) => s.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Attendance session not found"));
  }
  mockAttendanceSessions[index] = {
    ...mockAttendanceSessions[index],
    qrActive: !mockAttendanceSessions[index].qrActive,
  };
  return Promise.resolve(mockAttendanceSessions[index]);
}

export function getLmsIntegrations() {
  return Promise.resolve(mockLmsIntegrations);
}

export function connectLms(data: { name: string; baseUrl: string; description: string }) {
  const integration = {
    id: `lms-${Date.now()}`,
    name: data.name,
    baseUrl: data.baseUrl,
    description: data.description,
    status: "CONNECTED",
    syncSchedule: "Manual",
    lastSyncedAt: null,
    syncedRecords: 0,
    logo: data.name.charAt(0),
  };
  mockLmsIntegrations.unshift(integration);
  return Promise.resolve(integration);
}

export function disconnectLms(id: string) {
  const index = mockLmsIntegrations.findIndex((i) => i.id === id);
  if (index === -1) {
    return Promise.reject(new Error("LMS integration not found"));
  }
  mockLmsIntegrations[index] = {
    ...mockLmsIntegrations[index],
    status: "DISCONNECTED",
    baseUrl: "",
    syncSchedule: "Manual",
  };
  return Promise.resolve(mockLmsIntegrations[index]);
}

export function syncLms(id: string) {
  const index = mockLmsIntegrations.findIndex((i) => i.id === id);
  if (index === -1) {
    return Promise.reject(new Error("LMS integration not found"));
  }
  if (mockLmsIntegrations[index].status !== "CONNECTED") {
    return Promise.reject(new Error("LMS integration is not connected"));
  }
  const records = (mockLmsIntegrations[index].syncedRecords || 0) + 100;
  mockLmsIntegrations[index] = {
    ...mockLmsIntegrations[index],
    syncedRecords: records,
    lastSyncedAt: new Date().toISOString(),
  };
  return Promise.resolve(mockLmsIntegrations[index]);
}

export function getBillingSubscriptions() {
  return Promise.resolve(mockBillingSubscriptions);
}

export function getInvoiceHistory() {
  return Promise.resolve(mockInvoiceHistory);
}

export function upgradeSubscription(id: string, data: { plan: string; seats: number }) {
  const index = mockBillingSubscriptions.findIndex((s) => s.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Subscription not found"));
  }
  mockBillingSubscriptions[index] = {
    ...mockBillingSubscriptions[index],
    plan: data.plan,
    seats: data.seats,
  };
  return Promise.resolve(mockBillingSubscriptions[index]);
}

export function getBrandingConfig() {
  return Promise.resolve(mockBrandingConfig);
}

export function updateBrandingConfig(data: Partial<typeof mockBrandingConfig>) {
  Object.assign(mockBrandingConfig, data);
  return Promise.resolve(mockBrandingConfig);
}