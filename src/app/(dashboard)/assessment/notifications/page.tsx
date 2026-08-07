"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  getNotificationsForRole,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/features/assessment/services/assessment";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import type { RoleScopedNotification } from "@/features/assessment/mock/assessment";

const typeStyles: Record<string, string> = {
  assessment_submitted: "bg-blue-100 text-blue-700",
  feedback_available: "bg-green-100 text-green-700",
  remediation_required: "bg-red-100 text-red-700",
  remediation_due: "bg-orange-100 text-orange-700",
  pending_review: "bg-purple-100 text-purple-700",
  pending_faculty_reviews: "bg-purple-100 text-purple-700",
  student_acknowledged: "bg-green-100 text-green-700",
  department_progress: "bg-teal-100 text-teal-700",
  faculty_activity: "bg-indigo-100 text-indigo-700",
  competency_assigned: "bg-blue-100 text-blue-700",
  assessment_completed: "bg-green-100 text-green-700",
};

export default function NotificationsPage() {
  const { userRole } = useAuth();
  const [notifications, setNotifications] = useState<RoleScopedNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userRole) return;
    setIsLoading(true);
    setError(null);
    try {
      const items = await getNotificationsForRole(userRole);
      setNotifications(items);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load notifications"));
    } finally {
      setIsLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = (id: string) => {
    markNotificationAsRead(id)
      .then((updated) => {
        setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      })
      .catch(() => toast.error("Failed to mark notification as read"));
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead()
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      })
      .catch(() => toast.error("Failed to mark notifications as read"));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={userRole ? `Notifications for your ${userRole} account` : "View your notifications"}
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button variant="outline" size="sm" onClick={fetchNotifications}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card key={notification.id} className={notification.read ? "opacity-70" : "border-primary/30"}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{notification.title}</h3>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                      typeStyles[notification.type] ?? "bg-gray-100 text-gray-700"
                    }`}>{notification.type.replace(/_/g, " ")}</span>
                    {!notification.read && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkRead(notification.id)}>
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
