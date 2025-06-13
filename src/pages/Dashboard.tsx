import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  Building, 
  ShieldCheck, 
  Gift, 
  Megaphone,
  TrendingUp
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();

  const getWelcomeMessage = () => {
    switch (user?.role) {
      case 'SUPERADMIN':
        return 'System Administration Dashboard';
      case 'ADMIN':
        return 'Platform Administration Dashboard';
      case 'ORGADMIN':
        return `${user.organization?.name} Administration Dashboard`;
      default:
        return `Welcome to ${user?.organization?.name || 'Organization'} Portal`;
    }
  };

  const quickStats = [
    {
      title: 'Your Role',
      value: user?.role,
      icon: ShieldCheck,
      color: 'text-blue-600'
    },
    {
      title: 'Organization',
      value: user?.organization?.name || 'System Level',
      icon: Building,
      color: 'text-green-600'
    },
    {
      title: 'Active Permissions',
      value: user?.permissions.length || 0,
      icon: Users,
      color: 'text-purple-600'
    }
  ];

  const availableFeatures = [
    {
      name: 'Promotion Management',
      feature: 'promotion',
      icon: Megaphone,
      description: 'Manage promotional campaigns and offers',
      subFeatures: ['email', 'unique_code', 'qr_code', 'video', 'joining_bonus']
    },
    {
      name: 'Merchandise Management',
      feature: 'merchandise',
      icon: Gift,
      description: 'Handle merchandise and rewards',
      subFeatures: ['experience', 'loaded_value', 'autograph', 'merch_level']
    },
    {
      name: 'User Management',
      feature: 'user_management',
      icon: Users,
      description: 'Manage users and their permissions',
      subFeatures: ['view_users', 'manage_users', 'manage_permissions']
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-muted-foreground text-lg">
          {getWelcomeMessage()}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Available Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Available Features
          </CardTitle>
          <CardDescription>
            Features you have access to based on your role and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableFeatures.map((feature) => {
              const hasFeatureAccess = hasPermission(feature.feature, 'read');
              
              return (
                <Card key={feature.feature} className={!hasFeatureAccess ? 'opacity-50' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <feature.icon className="h-6 w-6 text-primary" />
                      <Badge variant={hasFeatureAccess ? 'default' : 'secondary'}>
                        {hasFeatureAccess ? 'Accessible' : 'Restricted'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{feature.name}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Sub-features:</p>
                      <div className="flex flex-wrap gap-1">
                        {feature.subFeatures.map((subFeature) => {
                          const hasSubFeatureAccess = hasPermission(feature.feature, 'read', subFeature);
                          return (
                            <Badge
                              key={subFeature}
                              variant={hasSubFeatureAccess ? 'outline' : 'secondary'}
                              className="text-xs"
                            >
                              {subFeature.replace('_', ' ')}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Role Information */}
      <Card>
        <CardHeader>
          <CardTitle>Role & Permissions Summary</CardTitle>
          <CardDescription>
            Your current access level and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Role Capabilities:</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                {user?.role === 'SUPERADMIN' && (
                  <p>• Full system access, can manage all organizations and users</p>
                )}
                {user?.role === 'ADMIN' && (
                  <p>• Can manage organizations and organization administrators</p>
                )}
                {user?.role === 'ORGADMIN' && (
                  <p>• Can manage users within your organization and configure features</p>
                )}
                {user?.role === 'USER' && (
                  <p>• Read-only access to features based on granted permissions</p>
                )}
              </div>
            </div>
            
            {user?.permissions && user.permissions.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Specific Permissions:</h3>
                <div className="space-y-2">
                  {user.permissions.map((permission, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="font-medium capitalize mb-1">
                        {permission.feature.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Actions: {permission.actions.join(', ')}
                      </div>
                      {permission.subFeatures.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Sub-features: {permission.subFeatures.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};