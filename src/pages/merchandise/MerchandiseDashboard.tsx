import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Star, 
  CreditCard, 
  PenTool, 
  Trophy,
  Plus,
  Package
} from 'lucide-react';

export const MerchandiseDashboard: React.FC = () => {
  const { hasPermission } = useAuth();

  const merchandiseTypes = [
    {
      name: 'Experience Rewards',
      subFeature: 'experience',
      icon: Star,
      description: 'Manage experience-based merchandise and rewards',
      route: '/merchandise/experience',
      color: 'text-yellow-600'
    },
    {
      name: 'Loaded Value',
      subFeature: 'loaded_value',
      icon: CreditCard,
      description: 'Handle value-loaded merchandise and gift cards',
      route: '/merchandise/loaded-value',
      color: 'text-green-600'
    },
    {
      name: 'Autograph Items',
      subFeature: 'autograph',
      icon: PenTool,
      description: 'Manage autographed merchandise and collectibles',
      route: '/merchandise/autographs',
      color: 'text-purple-600'
    },
    {
      name: 'Merchandise Levels',
      subFeature: 'merch_level',
      icon: Trophy,
      description: 'Configure tiered merchandise and level-based rewards',
      route: '/merchandise/levels',
      color: 'text-blue-600'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchandise Management</h1>
          <p className="text-muted-foreground">
            Manage your merchandise, rewards, and collectible items
          </p>
        </div>
        {hasPermission('merchandise', 'write') && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Items
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              +12 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              In Stock
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">
              Available items
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Redeemed This Month
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              +15% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Value
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$24.5K</div>
            <p className="text-xs text-muted-foreground">
              Merchandise value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Merchandise Types */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Merchandise Categories</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {merchandiseTypes.map((type) => {
            const hasAccess = hasPermission('merchandise', 'read', type.subFeature);
            const canWrite = hasPermission('merchandise', 'write', type.subFeature);
            
            return (
              <Card key={type.subFeature} className={!hasAccess ? 'opacity-50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <type.icon className={`h-6 w-6 ${type.color}`} />
                    <Badge variant={hasAccess ? 'default' : 'secondary'}>
                      {hasAccess ? 'Accessible' : 'Restricted'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {hasAccess && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={type.route}>View</Link>
                      </Button>
                    )}
                    {canWrite && (
                      <Button size="sm" asChild>
                        <Link to={`${type.route}/create`}>Manage</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Merchandise Activity</CardTitle>
          <CardDescription>
            Latest updates from your merchandise management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New autograph items added to inventory</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Experience reward redeemed by customer</p>
                <p className="text-xs text-muted-foreground">3 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Loaded value card batch created</p>
                <p className="text-xs text-muted-foreground">6 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};