import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Shield, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Building,
  Users,
  Settings
} from 'lucide-react';

interface AccessControlIndicatorProps {
  feature: string;
  subFeature?: string;
  action?: string;
  showDetails?: boolean;
  className?: string;
}

export const AccessControlIndicator: React.FC<AccessControlIndicatorProps> = ({
  feature,
  subFeature,
  action = 'read',
  showDetails = false,
  className = ''
}) => {
  const { 
    user, 
    hasPermission, 
    validateOrganizationFeatureAccess,
    getAccessDeniedReason,
    checkSystemLevelAccess
  } = useAuth();

  if (!user) {
    return (
      <Badge variant="destructive" className={className}>
        <Lock className="h-3 w-3 mr-1" />
        Not Authenticated
      </Badge>
    );
  }

  const hasUserPermission = hasPermission(feature, action as any, subFeature);
  const hasOrgFeature = validateOrganizationFeatureAccess(feature, subFeature);
  const isSystemFeature = checkSystemLevelAccess(feature);
  const hasFullAccess = hasUserPermission && (isSystemFeature || hasOrgFeature);

  const getStatusInfo = () => {
    if (hasFullAccess) {
      return {
        variant: 'default' as const,
        icon: CheckCircle,
        text: 'Accessible',
        color: 'text-green-600'
      };
    }

    if (!hasUserPermission) {
      return {
        variant: 'destructive' as const,
        icon: Lock,
        text: 'No Permission',
        color: 'text-red-600'
      };
    }

    if (!hasOrgFeature && !isSystemFeature) {
      return {
        variant: 'secondary' as const,
        icon: Building,
        text: 'Org Disabled',
        color: 'text-yellow-600'
      };
    }

    return {
      variant: 'secondary' as const,
      icon: AlertTriangle,
      text: 'Restricted',
      color: 'text-yellow-600'
    };
  };

  const statusInfo = getStatusInfo();

  if (!showDetails) {
    return (
      <Badge variant={statusInfo.variant} className={className}>
        <statusInfo.icon className="h-3 w-3 mr-1" />
        {statusInfo.text}
      </Badge>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Badge variant={statusInfo.variant}>
          <statusInfo.icon className="h-3 w-3 mr-1" />
          {statusInfo.text}
        </Badge>
        
        {user.role === 'SUPERADMIN' && (
          <Badge variant="outline" className="text-purple-600 border-purple-200">
            <Shield className="h-3 w-3 mr-1" />
            SUPERADMIN
          </Badge>
        )}
        
        {isSystemFeature && (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <Settings className="h-3 w-3 mr-1" />
            System
          </Badge>
        )}
      </div>

      {!hasFullAccess && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <div className="space-y-1">
              <p className="font-medium">Access Restricted</p>
              <p>{getAccessDeniedReason(feature, action as any, subFeature)}</p>
              
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  <span>Your Role: {user.role}</span>
                </div>
                
                {user.organization && (
                  <div className="flex items-center gap-2">
                    <Building className="h-3 w-3" />
                    <span>Organization: {user.organization.name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <span>
                    User Permission: {hasUserPermission ? '✓' : '✗'} | 
                    Org Feature: {hasOrgFeature || isSystemFeature ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Helper component for quick access status
export const QuickAccessStatus: React.FC<{
  feature: string;
  subFeature?: string;
  action?: string;
}> = ({ feature, subFeature, action }) => {
  return (
    <AccessControlIndicator 
      feature={feature}
      subFeature={subFeature}
      action={action}
      showDetails={false}
      className="inline-flex"
    />
  );
};

// Helper component for detailed access information
export const DetailedAccessInfo: React.FC<{
  feature: string;
  subFeature?: string;
  action?: string;
}> = ({ feature, subFeature, action }) => {
  return (
    <AccessControlIndicator 
      feature={feature}
      subFeature={subFeature}
      action={action}
      showDetails={true}
      className="w-full"
    />
  );
};