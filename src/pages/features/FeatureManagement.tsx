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
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import {
  Layers,
  Plus,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Feature, UserRole, PermissionAction } from "../../types";
import { HttpClient } from "@/lib/axios";

type FeatureStatus = "pending" | "in_progress" | "done";

export const FeatureManagement: React.FC = () => {
  const { hasRole } = useAuth();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [newFeature, setNewFeature] = useState({
    name: "",
    displayName: "",
    description: "",
    requiredRole: "USER" as UserRole,
    status: "pending" as FeatureStatus,
    subFeatures: [] as Array<{
      name: string;
      displayName: string;
      description: string;
      actions: PermissionAction[];
    }>,
  });

  const [newSubFeature, setNewSubFeature] = useState({
    name: "",
    displayName: "",
    description: "",
    actions: [] as PermissionAction[],
  });

  useEffect(() => {
    if (hasRole("SUPERADMIN")) {
      fetchFeatures();
    }
  }, []);

  const fetchFeatures = async () => {
    try {
      const response = await HttpClient.get("/features");
      setFeatures(response.data.features);
    } catch (error) {
      toast.error("Failed to fetch features");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeature = async () => {
    try {
      await HttpClient.post("/features", newFeature);

      toast.success("Feature created successfully");
      setIsCreateDialogOpen(false);
      setNewFeature({
        name: "",
        displayName: "",
        description: "",
        requiredRole: "USER",
        status: "pending",
        subFeatures: [],
      });
      fetchFeatures();
    } catch (error: any) {
      toast.error(error.response?.data?.error ?? "Failed to create feature");
    }
  };

  const handleUpdateFeature = async () => {
    if (!selectedFeature) return;

    try {
      await HttpClient.put(`/features/${selectedFeature._id}`, newFeature);

      toast.success("Feature updated successfully");
      setIsEditDialogOpen(false);
      setSelectedFeature(null);
      fetchFeatures();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update feature");
    }
  };

  const openEditDialog = (feature: Feature) => {
    setSelectedFeature(feature);
    setNewFeature({
      name: feature.name,
      displayName: feature.displayName,
      description: feature.description || "",
      requiredRole: feature.requiredRole,
      status: (feature as any).status || "done",
      subFeatures: feature.subFeatures.map((sf) => ({
        name: sf.name,
        displayName: sf.displayName,
        description: sf.description || "",
        actions: sf.actions,
      })),
    });
    setIsEditDialogOpen(true);
  };

  const addSubFeature = () => {
    if (newSubFeature.name && newSubFeature.displayName) {
      setNewFeature((prev) => ({
        ...prev,
        subFeatures: [...prev.subFeatures, { ...newSubFeature }],
      }));
      setNewSubFeature({
        name: "",
        displayName: "",
        description: "",
        actions: [],
      });
    }
  };

  const removeSubFeature = (index: number) => {
    setNewFeature((prev) => ({
      ...prev,
      subFeatures: prev.subFeatures.filter((_, i) => i !== index),
    }));
  };

  const toggleAction = (action: PermissionAction) => {
    setNewSubFeature((prev) => ({
      ...prev,
      actions: prev.actions.includes(action)
        ? prev.actions.filter((a) => a !== action)
        : [...prev.actions, action],
    }));
  };

  const getStatusIcon = (status: FeatureStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "in_progress":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "done":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: FeatureStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "done":
        return "bg-green-100 text-green-800";
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
          <h1 className="text-3xl font-bold tracking-tight">
            Feature Management
          </h1>
          <p className="text-muted-foreground">
            Manage system features and their sub-features
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Feature
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Feature</DialogTitle>
              <DialogDescription>
                Add a new system feature with sub-features and permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Feature Name</Label>
                  <Input
                    id="name"
                    value={newFeature.name}
                    onChange={(e) =>
                      setNewFeature((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="feature_name"
                  />
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={newFeature.displayName}
                    onChange={(e) =>
                      setNewFeature((prev) => ({
                        ...prev,
                        displayName: e.target.value,
                      }))
                    }
                    placeholder="Feature Name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newFeature.description}
                  onChange={(e) =>
                    setNewFeature((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Feature description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="requiredRole">Required Role</Label>
                  <Select
                    value={newFeature.requiredRole}
                    onValueChange={(value: UserRole) =>
                      setNewFeature((prev) => ({
                        ...prev,
                        requiredRole: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">USER</SelectItem>
                      <SelectItem value="ORGADMIN">ORGADMIN</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                      <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newFeature.status}
                    onValueChange={(value: FeatureStatus) =>
                      setNewFeature((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sub-features */}
              <div className="space-y-4">
                <Label>Sub-features</Label>

                {/* Add sub-feature form */}
                <Card className="p-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="subFeatureName">Sub-feature Name</Label>
                        <Input
                          id="subFeatureName"
                          value={newSubFeature.name}
                          onChange={(e) =>
                            setNewSubFeature((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="sub_feature_name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subFeatureDisplayName">
                          Display Name
                        </Label>
                        <Input
                          id="subFeatureDisplayName"
                          value={newSubFeature.displayName}
                          onChange={(e) =>
                            setNewSubFeature((prev) => ({
                              ...prev,
                              displayName: e.target.value,
                            }))
                          }
                          placeholder="Sub Feature Name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="subFeatureDescription">Description</Label>
                      <Input
                        id="subFeatureDescription"
                        value={newSubFeature.description}
                        onChange={(e) =>
                          setNewSubFeature((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Sub-feature description"
                      />
                    </div>

                    <div>
                      <Label>Actions</Label>
                      <div className="flex gap-2 mt-2">
                        {(
                          [
                            "read",
                            "write",
                            "delete",
                            "manage",
                          ] as PermissionAction[]
                        ).map((action) => (
                          <Button
                            key={action}
                            type="button"
                            variant={
                              newSubFeature.actions.includes(action)
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => toggleAction(action)}
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button type="button" onClick={addSubFeature} size="sm">
                      Add Sub-feature
                    </Button>
                  </div>
                </Card>

                {/* Existing sub-features */}
                <div className="space-y-2">
                  {newFeature.subFeatures.map((subFeature, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {subFeature.displayName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Actions: {subFeature.actions.join(", ")}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSubFeature(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateFeature}>Create Feature</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Features List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Layers className="h-6 w-6 text-primary" />
                <div className="flex gap-2">
                  <Badge
                    className={getStatusColor(
                      (feature as any).status || "done"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {getStatusIcon((feature as any).status || "done")}
                      {(feature as any).status || "done"}
                    </div>
                  </Badge>
                  <Badge variant="outline">{feature.requiredRole}</Badge>
                </div>
              </div>
              <CardTitle className="text-lg">{feature.displayName}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sub-features:</span>
                  <Badge variant="outline">{feature.subFeatures.length}</Badge>
                </div>

                <div className="space-y-2">
                  {feature.subFeatures.slice(0, 3).map((subFeature) => (
                    <div key={subFeature.name} className="text-sm">
                      <div className="font-medium">
                        {subFeature.displayName}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {subFeature.actions.join(", ")}
                      </div>
                    </div>
                  ))}
                  {feature.subFeatures.length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      +{feature.subFeatures.length - 3} more
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(feature)}
                  className="w-full"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Feature
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Feature</DialogTitle>
            <DialogDescription>
              Update feature details and sub-features
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editName">Feature Name</Label>
                <Input
                  id="editName"
                  value={newFeature.name}
                  onChange={(e) =>
                    setNewFeature((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="feature_name"
                />
              </div>
              <div>
                <Label htmlFor="editDisplayName">Display Name</Label>
                <Input
                  id="editDisplayName"
                  value={newFeature.displayName}
                  onChange={(e) =>
                    setNewFeature((prev) => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                  placeholder="Feature Name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={newFeature.description}
                onChange={(e) =>
                  setNewFeature((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Feature description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editRequiredRole">Required Role</Label>
                <Select
                  value={newFeature.requiredRole}
                  onValueChange={(value: UserRole) =>
                    setNewFeature((prev) => ({ ...prev, requiredRole: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="ORGADMIN">ORGADMIN</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={newFeature.status}
                  onValueChange={(value: FeatureStatus) =>
                    setNewFeature((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sub-features for editing */}
            <div className="space-y-4">
              <Label>Sub-features</Label>
              <div className="space-y-2">
                {newFeature.subFeatures.map((subFeature, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {subFeature.displayName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Actions: {subFeature.actions.join(", ")}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSubFeature(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateFeature}>Update Feature</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
