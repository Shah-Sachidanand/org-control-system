import React, { useState, useEffect } from "react";
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
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Calendar,
  Target,
} from "lucide-react";
import axios from "axios";
import { Promotion, PromotionType, PromotionStatus } from "../../types";
import { format } from "date-fns";
import { HttpClient } from "@/lib/axios";

export const ViewPromotions: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<PromotionType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<PromotionStatus | "all">(
    "all"
  );
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null
  );
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchPromotions();
  }, [filterType, filterStatus]);

  const fetchPromotions = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("type", filterType);
      if (filterStatus !== "all") params.append("status", filterStatus);

      const response = await HttpClient.get(`/promotions?${params.toString()}`);
      setPromotions(response.data.promotions);
    } catch (error) {
      toast.error("Failed to fetch promotions");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (promotionId: string) => {
    try {
      const response = await HttpClient.get(
        `/promotions/${promotionId}/analytics`
      );
      setAnalytics(response.data.analytics);
    } catch (error) {
      toast.error("Failed to fetch analytics");
    }
  };

  const handleDeletePromotion = async (promotionId: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return;

    try {
      await axios.delete(`/api/promotions/${promotionId}`);
      toast.success("Promotion deleted successfully");
      fetchPromotions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete promotion");
    }
  };

  const handleViewAnalytics = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    fetchAnalytics(promotion._id);
  };

  const filteredPromotions = promotions.filter(
    (promotion) =>
      promotion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: PromotionStatus) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: PromotionType) => {
    switch (type) {
      case "email":
        return "bg-blue-100 text-blue-800";
      case "unique_code":
        return "bg-green-100 text-green-800";
      case "qr_code":
        return "bg-purple-100 text-purple-800";
      case "video":
        return "bg-red-100 text-red-800";
      case "joining_bonus":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
          <p className="text-muted-foreground">
            Manage and track your promotional campaigns
          </p>
        </div>
        {hasPermission("promotion", "write") && (
          <Button asChild>
            <Link to="/promotions/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Promotion
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search promotions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filterType}
              onValueChange={(value: PromotionType | "all") =>
                setFilterType(value)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="unique_code">Unique Code</SelectItem>
                <SelectItem value="qr_code">QR Code</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="joining_bonus">Joining Bonus</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterStatus}
              onValueChange={(value: PromotionStatus | "all") =>
                setFilterStatus(value)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Promotions Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPromotions.map((promotion) => (
          <Card
            key={promotion._id}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{promotion.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {promotion.description}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={getStatusColor(promotion.status)}>
                    {promotion.status}
                  </Badge>
                  <Badge className={getTypeColor(promotion.type)}>
                    {promotion.type.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(promotion.startDate), "MMM dd")} -{" "}
                  {format(new Date(promotion.endDate), "MMM dd, yyyy")}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  {promotion.settings.currentRedemptions} /{" "}
                  {promotion.settings.maxRedemptions} redeemed
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/promotions/${promotion._id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewAnalytics(promotion)}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                  </Button>

                  {hasPermission("promotion", "write") && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/promotions/${promotion._id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                  )}

                  {hasPermission("promotion", "delete") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePromotion(promotion._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPromotions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              No promotions found.{" "}
              {hasPermission("promotion", "write") && (
                <>
                  <Link
                    to="/promotions/create"
                    className="text-primary hover:underline"
                  >
                    Create your first promotion
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Dialog */}
      <Dialog
        open={!!selectedPromotion}
        onOpenChange={() => setSelectedPromotion(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Analytics - {selectedPromotion?.title}</DialogTitle>
            <DialogDescription>
              Performance metrics for this promotion
            </DialogDescription>
          </DialogHeader>
          {analytics && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.views.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.clicks.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Conversions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.conversions.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${analytics.revenue.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">CTR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.clickThroughRate}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.conversionRate}%
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
