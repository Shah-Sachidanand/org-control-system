import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  ShieldX, 
  ArrowLeft, 
  Settings, 
  Users, 
  Building, 
  Mail,
  AlertTriangle,
  Info
} from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const getRoleSpecificRecommendations = () => {
    if (!user) return [];

    const recommendations = [];

    switch (user.role) {
      case 'USER':
        recommendations.push({
          icon: Mail,
          title: 'Request Access',
          description: 'Contact your organization administrator to request additional permissions.',
          action: 'Contact Admin'
        });
        break;
      
      case 'ORGADMIN':
        recommendations.push({
          icon: Settings,
          title: 'Enable Organization Features',
          description: 'Some features may be disabled for your organization. Check organization settings.',
          action: 'Organization Settings',
          href: '/organizations'
        });
        recommendations.push({
          icon: Mail,
          title: 'Request Platform Access',
          description: 'Contact platform administrators for higher-level access.',
          action: 'Contact Platform Admin'
        });
        break;
      
      case 'ADMIN':
        recommendations.push({
          icon: Building,
          title: 'Check Organization Access',
          description: 'You may only access organizations you created or manage.',
          action: 'View Organizations',
          href: '/organizations'
        });
        break;
      
      case 'SUPERADMIN':
        recommendations.push({
          icon: Settings,
          title: 'System Configuration',
          description: 'Check system-wide feature configurations and permissions.',
          action: 'System Settings',
          href: '/features'
        });
        break;
    }

    return recommendations;
  };

  const getContextualMessage = () => {
    if (!user) {
      return "You must be logged in to access this resource.";
    }

    if (!user.organization && user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') {
      return "You are not assigned to any organization. Contact your administrator to be added to an organization.";
    }

    return "You don't have permission to access this resource. This could be due to insufficient role permissions or disabled organization features.";
  };

  const recommendations = getRoleSpecificRecommendations();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <ShieldX className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-700">
            Access Denied
          </CardTitle>
          <CardDescription className="text-base">
            {getContextualMessage()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {user && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p><strong>Your Role:</strong> {user.role}</p>
                  {user.organization && (
                    <p><strong>Organization:</strong> {user.organization.name}</p>
                  )}
                  <p><strong>Permissions:</strong> {user.permissions.length} feature permissions assigned</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {recommendations.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Recommended Actions
              </h3>
              
              <div className="grid gap-3">
                {recommendations.map((rec, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <rec.icon className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rec.description}
                        </p>
                        {rec.href ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={rec.href}>{rec.action}</Link>
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // In a real app, this would open a contact form or email client
                              alert('Contact functionality would be implemented here');
                            }}
                          >
                            {rec.action}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={() => navigate(-1)} variant="outline" className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button asChild className="flex-1">
              <Link to="/">Return to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};