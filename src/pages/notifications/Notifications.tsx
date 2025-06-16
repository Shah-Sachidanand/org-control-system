import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail,
  Gift,
  Settings as SettingsIcon,
} from "lucide-react";
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from "../../types";
import { formatDistanceToNow } from "date-fns";
import { HttpClient } from "@/lib/axios";

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    status: NotificationStatus | "all";
    type: NotificationType | "all";
  }>({
    status: "all",
    type: "all",
  });

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status !== "all") params.append("status", filter.status);
      if (filter.type !== "all") params.append("type", filter.type);

      const response = await HttpClient.get(
        `/notifications?${params.toString()}`
      );
      setNotifications(response.data.notifications);
    } catch (error) {
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await HttpClient.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                status: "read",
                readAt: new Date().toISOString(),
              }
            : notification
        )
      );
      toast.success("Notification marked as read");
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to mark notification as read"
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await HttpClient.patch("/notifications/mark-all-read");
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          status: "read" as NotificationStatus,
          readAt: new Date().toISOString(),
        }))
      );
      toast.success("All notifications marked as read");
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          "Failed to mark all notifications as read"
      );
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "invitation":
        return <Mail className="h-4 w-4 text-purple-500" />;
      case "promotion":
        return <Gift className="h-4 w-4 text-orange-500" />;
      case "system":
        return <SettingsIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case "info":
        return "bg-blue-100 text-blue-800";
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "invitation":
        return "bg-purple-100 text-purple-800";
      case "promotion":
        return "bg-orange-100 text-orange-800";
      case "system":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your latest activities and updates
            {unreadCount > 0 && (
              <span className="ml-2">
                • {unreadCount} unread notification
                {unreadCount !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Select
              value={filter.status}
              onValueChange={(value: NotificationStatus | "all") =>
                setFilter((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.type}
              onValueChange={(value: NotificationType | "all") =>
                setFilter((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="invitation">Invitation</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card
            key={notification._id}
            className={`hover:shadow-md transition-shadow ${
              notification.status === "unread"
                ? "border-l-4 border-l-primary bg-primary/5"
                : ""
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <Badge className={getTypeColor(notification.type)}>
                        {notification.type}
                      </Badge>
                      {notification.status === "unread" && (
                        <Badge variant="secondary">New</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {notification.organizationId && (
                        <span>• Organization notification</span>
                      )}
                      {notification.readAt && (
                        <span>
                          • Read{" "}
                          {formatDistanceToNow(new Date(notification.readAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {notification.actionUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={notification.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </Button>
                  )}
                  {notification.status === "unread" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification._id)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Mark as Read
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {notifications.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-muted-foreground">
              No notifications found. You're all caught up!
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
