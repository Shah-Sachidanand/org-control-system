import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building,
  Activity,
  Eye,
  Lock,
  Unlock,
  Info
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userRole: string;
  organizationId?: string;
  organizationName?: string;
  resource: string;
  action: string;
  success: boolean;
  reason?: string;
  userAgent: string;
  ipAddress: string;
}

export const SecurityAuditPanel: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Only show to SUPERADMIN and ADMIN
  if (!user || (!hasRole('SUPERADMIN') && !hasRole('ADMIN'))) {
    return null;
  }

  // Mock audit logs (in production, these would come from your audit service)
  useEffect(() => {
    const mockLogs: AuditLog[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        organizationId: user.organization?._id,
        organizationName: user.organization?.name,
        resource: 'promotion',
        action: 'read',
        success: true,
        reason: 'Permission and organization validation passed',
        userAgent: navigator.userAgent,
        ipAddress: 'client-side'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        userId: 'user123',
        userEmail: 'user@example.com',
        userRole: 'USER',
        organizationId: 'org123',
        organizationName: 'Example Org',
        resource: 'merchandise',
        action: 'write',
        success: false,
        reason: 'User lacks write permission for feature merchandise',
        userAgent: 'Mozilla/5.0...',
        ipAddress: '192.168.1.100'
      }
    ];
    setAuditLogs(mockLogs);
  }, [user]);

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusColor = (success: boolean) => {
    return success 
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case 'ADMIN':
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case 'ORGADMIN':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="shadow-lg"
        >
          <Shield className="h-4 w-4 mr-2" />
          Security Audit
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="shadow-xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Security Audit</CardTitle>
            </div>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
            >
              ×
            </Button>
          </div>
          <CardDescription>
            Real-time access control monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
              <div className="text-lg font-bold text-green-600">
                {auditLogs.filter(log => log.success).length}
              </div>
              <div className="text-xs text-green-600">Granted</div>
            </div>
            <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded">
              <div className="text-lg font-bold text-red-600">
                {auditLogs.filter(log => !log.success).length}
              </div>
              <div className="text-xs text-red-600">Denied</div>
            </div>
          </div>

          <Separator />

          {/* Recent Activity */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </h4>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 border rounded-lg space-y-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.success)}
                        <span className="font-medium">{log.resource}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.action}
                        </Badge>
                      </div>
                      <Badge className={getStatusColor(log.success)}>
                        {log.success ? 'Granted' : 'Denied'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{log.userEmail}</span>
                      <Badge className={getRoleColor(log.userRole)} variant="outline">
                        {log.userRole}
                      </Badge>
                    </div>

                    {log.organizationName && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building className="h-3 w-3" />
                        <span>{log.organizationName}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>

                    {log.reason && (
                      <div className="flex items-start gap-2 text-xs">
                        <Info className="h-3 w-3 mt-0.5 text-blue-500" />
                        <span className="text-muted-foreground">{log.reason}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Current User Status */}
          <Separator />
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Your Status
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span>Role:</span>
                <Badge className={getRoleColor(user.role)}>
                  {user.role}
                </Badge>
              </div>
              {user.organization && (
                <div className="flex items-center justify-between">
                  <span>Organization:</span>
                  <span className="text-muted-foreground">
                    {user.organization.name}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Permissions:</span>
                <span className="text-muted-foreground">
                  {user.permissions.length} features
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Session:</span>
                <div className="flex items-center gap-1">
                  <Unlock className="h-3 w-3 text-green-500" />
                  <span className="text-green-600 text-xs">Active</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};