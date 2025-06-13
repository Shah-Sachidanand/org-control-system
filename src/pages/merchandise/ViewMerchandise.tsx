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
  Eye,
  Edit,
  Trash2,
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import { Merchandise, MerchandiseType, MerchandiseStatus } from "../../types";
import { HttpClient } from "@/lib/axios";

export const ViewMerchandise: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [merchandise, setMerchandise] = useState<Merchandise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<MerchandiseType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<MerchandiseStatus | "all">(
    "all"
  );
  const [selectedMerchandise, setSelectedMerchandise] =
    useState<Merchandise | null>(null);

  useEffect(() => {
    fetchMerchandise();
  }, [filterType, filterStatus]);

  const fetchMerchandise = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("type", filterType);
      if (filterStatus !== "all") params.append("status", filterStatus);

      const response = await HttpClient.get(
        `/merchandise?${params.toString()}`
      );
      setMerchandise(response.data.merchandise);
    } catch (error) {
      toast.error("Failed to fetch merchandise");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMerchandise = async (merchandiseId: string) => {
    if (!confirm("Are you sure you want to delete this merchandise?")) return;

    try {
      await axios.delete(`/api/merchandise/${merchandiseId}`);
      toast.success("Merchandise deleted successfully");
      fetchMerchandise();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to delete merchandise"
      );
    }
  };

  const handleUpdateStock = async (
    merchandiseId: string,
    operation: "add" | "subtract" | "set",
    quantity: number
  ) => {
    try {
      await HttpClient.patch(`/merchandise/${merchandiseId}/stock`, {
        operation,
        quantity,
      });
      toast.success("Stock updated successfully");
      fetchMerchandise();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update stock");
    }
  };

  const filteredMerchandise = merchandise.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: MerchandiseStatus) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "out_of_stock":
        return "bg-red-100 text-red-800";
      case "discontinued":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: MerchandiseType) => {
    switch (type) {
      case "experience":
        return "bg-blue-100 text-blue-800";
      case "loaded_value":
        return "bg-green-100 text-green-800";
      case "autograph":
        return "bg-purple-100 text-purple-800";
      case "merch_level":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isLowStock = (item: Merchandise) => {
    return (
      item.inventory.trackInventory &&
      item.inventory.quantity <= item.inventory.lowStockThreshold
    );
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
          <h1 className="text-3xl font-bold tracking-tight">Merchandise</h1>
          <p className="text-muted-foreground">
            Manage your merchandise inventory and rewards
          </p>
        </div>
        {hasPermission("merchandise", "write") && (
          <Button asChild>
            <Link to="/merchandise/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Merchandise
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{merchandise.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {merchandise.filter((item) => item.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {merchandise.filter(isLowStock).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {merchandise
                .reduce(
                  (total, item) =>
                    total + item.pricing.cost * item.inventory.quantity,
                  0
                )
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search merchandise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filterType}
              onValueChange={(value: MerchandiseType | "all") =>
                setFilterType(value)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="experience">Experience</SelectItem>
                <SelectItem value="loaded_value">Loaded Value</SelectItem>
                <SelectItem value="autograph">Autograph</SelectItem>
                <SelectItem value="merch_level">Merch Level</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterStatus}
              onValueChange={(value: MerchandiseStatus | "all") =>
                setFilterStatus(value)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Merchandise Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMerchandise.map((item) => (
          <Card key={item._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {item.description}
                  </CardDescription>
                  <div className="text-sm text-muted-foreground">
                    Category: {item.category}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={getStatusColor(item.status)}>
                    {item.status.replace("_", " ")}
                  </Badge>
                  <Badge className={getTypeColor(item.type)}>
                    {item.type.replace("_", " ")}
                  </Badge>
                  {isLowStock(item) && (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Low Stock
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">
                    ${item.pricing.cost} {item.pricing.currency}
                    {item.pricing.pointsRequired && (
                      <span className="text-muted-foreground ml-2">
                        or {item.pricing.pointsRequired} pts
                      </span>
                    )}
                  </span>
                </div>

                {item.inventory.trackInventory && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stock:</span>
                    <span
                      className={`font-medium ${
                        isLowStock(item) ? "text-red-600" : ""
                      }`}
                    >
                      {item.inventory.quantity} units
                    </span>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/merchandise/${item._id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>

                  {hasPermission("merchandise", "write") && (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/merchandise/${item._id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Package className="mr-2 h-4 w-4" />
                            Stock
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Update Stock - {item.name}
                            </DialogTitle>
                            <DialogDescription>
                              Current stock: {item.inventory.quantity} units
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <Button
                                onClick={() =>
                                  handleUpdateStock(item._id, "add", 10)
                                }
                                variant="outline"
                              >
                                +10
                              </Button>
                              <Button
                                onClick={() =>
                                  handleUpdateStock(item._id, "add", 1)
                                }
                                variant="outline"
                              >
                                +1
                              </Button>
                              <Button
                                onClick={() =>
                                  handleUpdateStock(item._id, "subtract", 1)
                                }
                                variant="outline"
                              >
                                -1
                              </Button>
                              <Button
                                onClick={() =>
                                  handleUpdateStock(item._id, "subtract", 10)
                                }
                                variant="outline"
                              >
                                -10
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}

                  {hasPermission("merchandise", "delete") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMerchandise(item._id)}
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

      {filteredMerchandise.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              No merchandise found.{" "}
              {hasPermission("merchandise", "write") && (
                <>
                  <Link
                    to="/merchandise/add"
                    className="text-primary hover:underline"
                  >
                    Add your first merchandise item
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
