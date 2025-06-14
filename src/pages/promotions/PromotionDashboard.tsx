import React from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Mail, Hash, QrCode, Video, Gift, Plus, BarChart3 } from "lucide-react";

export const PromotionDashboard: React.FC = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const promotionTypes = [
    {
      name: "Email Campaigns",
      subFeature: "email",
      icon: Mail,
      description: "Create and manage email-based promotional campaigns",
      route: {
        create: "/promotions/create?type=email",
        view: "/promotions/view?type=email",
      },
      color: "text-blue-600",
    },
    {
      name: "Unique Codes",
      subFeature: "unique_code",
      icon: Hash,
      description: "Generate and track unique promotional codes",
      route: {
        create: "/promotions/create?type=unique-codes",
        view: "/promotions/view?type=unique-codes",
      },
      color: "text-green-600",
    },
    {
      name: "QR Codes",
      subFeature: "qr_code",
      icon: QrCode,
      description: "Create QR code-based promotional campaigns",
      route: {
        create: "/promotions/create?type=qr-codes",
        view: "/promotions/view?type=qr-codes",
      },
      color: "text-purple-600",
    },
    {
      name: "Video Campaigns",
      subFeature: "video",
      icon: Video,
      description: "Manage video-based promotional content",
      route: {
        create: "/promotions/create?type=video",
        view: "/promotions/view?type=video",
      },
      color: "text-red-600",
    },
    {
      name: "Joining Bonus",
      subFeature: "joining_bonus",
      icon: Gift,
      description: "Set up and manage new member joining bonuses",
      route: {
        create: "/promotions/create?type=joining-bonus",
        view: "/promotions/view?type=joining-bonus",
      },
      color: "text-orange-600",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Promotion Management
          </h1>
          <p className="text-muted-foreground">
            Manage all your promotional campaigns and offers
          </p>
        </div>
        {hasPermission("promotion", "write") && (
          <Button
            onClick={() => navigate("/promotions/create")}
            className="w-full md:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Campaign
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Campaigns
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Campaigns
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15.2K</div>
            <p className="text-xs text-muted-foreground">People reached</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5%</div>
            <p className="text-xs text-muted-foreground">
              +1.2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Promotion Types */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Promotion Types</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {promotionTypes.map((type) => {
            const hasAccess = hasPermission(
              "promotion",
              "read",
              type.subFeature
            );
            const canWrite = hasPermission(
              "promotion",
              "write",
              type.subFeature
            );

            return (
              <Card
                key={type.subFeature}
                className={!hasAccess ? "opacity-50" : ""}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <type.icon className={`h-6 w-6 ${type.color}`} />
                    <Badge variant={hasAccess ? "default" : "secondary"}>
                      {hasAccess ? "Accessible" : "Restricted"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {hasAccess && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={type.route.view}>View</Link>
                      </Button>
                    )}
                    {canWrite && (
                      <Button size="sm" asChild>
                        <Link to={`${type.route.create}`}>Create</Link>
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
          <CardTitle>Recent Campaign Activity</CardTitle>
          <CardDescription>
            Latest updates from your promotional campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Email Campaign "Summer Sale" launched
                </p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  QR Code campaign reached 1,000 scans
                </p>
                <p className="text-xs text-muted-foreground">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Unique code batch generated
                </p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
