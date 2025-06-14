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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Switch } from "../../components/ui/switch";
import { toast } from "sonner";
import { Building, Plus, Settings } from "lucide-react";
import { Organization, Feature } from "../../types";
import { HttpClient } from "@/lib/axios";
import { ISubFeature } from "server/types";

export const OrganizationManagement: React.FC = () => {
  const { hasRole } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);

  const [newOrg, setNewOrg] = useState({
    name: "",
    description: "",
  });

  const [orgFeatures, setOrgFeatures] = useState<any[]>([]);

  useEffect(() => {
    if (hasRole("ADMIN") || hasRole("SUPERADMIN")) {
      fetchOrganizations();
      fetchFeatures();
    }
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await HttpClient.get("/organizations");
      setOrganizations(response.data.organizations);
    } catch (error) {
      toast.error("Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatures = async () => {
    try {
      const response = await HttpClient.get("/features");
      setFeatures(response.data.features);
    } catch (error) {
      toast.error("Failed to fetch features");
    }
  };

  const handleCreateOrganization = async () => {
    try {
      await HttpClient.post("/organizations", newOrg);

      toast.success("Organization created successfully");
      setIsCreateDialogOpen(false);
      setNewOrg({ name: "", description: "" });
      fetchOrganizations();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to create organization"
      );
    }
  };

  const handleUpdateFeatures = async () => {
    if (!selectedOrg) return;

    try {
      await HttpClient.put(`/organizations/${selectedOrg._id}/features`, {
        features: orgFeatures,
      });

      toast.success("Organization features updated successfully");
      setIsFeatureDialogOpen(false);
      fetchOrganizations();
    } catch (error: any) {
      toast.error(error.response?.data?.error ?? "Failed to update features");
    }
  };

  const openFeatureDialog = (org: Organization) => {
    setSelectedOrg(org);

    // Initialize org features with all available features
    const initialFeatures = features.map((feature) => {
      const existingFeature = org.features.find((f) => f.name === feature.name);

      return {
        name: feature.name,
        isEnabled: existingFeature?.isEnabled || false,
        subFeatures: feature.subFeatures.map((subFeature) => {
          const existingSubFeature = existingFeature?.subFeatures.find(
            (sf) => sf.name === subFeature.name
          );
          return {
            name: subFeature.name,
            isEnabled: existingSubFeature?.isEnabled || false,
          };
        }),
      };
    });

    setOrgFeatures(initialFeatures);
    setIsFeatureDialogOpen(true);
  };

  const toggleFeature = (featureName: string, enabled: boolean) => {
    setOrgFeatures((prev) =>
      prev.map((feature) =>
        feature.name === featureName
          ? { ...feature, isEnabled: enabled }
          : feature
      )
    );
  };

  const toggleSubFeature = (
    featureName: string,
    subFeatureName: string,
    enabled: boolean
  ) => {
    setOrgFeatures((prev) =>
      prev.map((feature) =>
        feature.name === featureName
          ? {
              ...feature,
              subFeatures: feature.subFeatures.map((subFeature: ISubFeature) =>
                subFeature.name === subFeatureName
                  ? { ...subFeature, isEnabled: enabled }
                  : subFeature
              ),
            }
          : feature
      )
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
          <h1 className="text-3xl font-bold tracking-tight">
            Organization Management
          </h1>
          <p className="text-muted-foreground">
            Manage organizations and their feature access
          </p>
        </div>
        {hasRole("SUPERADMIN") ||
          (hasRole("ADMIN") && (
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                  <DialogDescription>
                    Add a new organization to the system
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      value={newOrg.name}
                      onChange={(e) =>
                        setNewOrg((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newOrg.description}
                      onChange={(e) =>
                        setNewOrg((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateOrganization}>
                    Create Organization
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ))}
      </div>

      {/* Organizations List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => (
          <Card key={org._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Building className="h-6 w-6 text-primary" />
                <Badge variant={org.isActive ? "default" : "secondary"}>
                  {org.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardTitle className="text-lg">{org.name}</CardTitle>
              <CardDescription>{org.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Features Enabled:
                  </span>
                  <Badge variant="outline">
                    {org.features.filter((f) => f.isEnabled).length} /{" "}
                    {org.features.length}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openFeatureDialog(org)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Configuration Dialog */}
      <Dialog open={isFeatureDialogOpen} onOpenChange={setIsFeatureDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Features - {selectedOrg?.name}</DialogTitle>
            <DialogDescription>
              Enable or disable features and sub-features for this organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {features.map((feature) => {
              const orgFeature = orgFeatures.find(
                (f) => f.name === feature.name
              );

              return (
                <Card key={feature.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {feature.displayName}
                        </CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </div>
                      <Switch
                        checked={orgFeature?.isEnabled || false}
                        onCheckedChange={(checked) =>
                          toggleFeature(feature.name, checked)
                        }
                      />
                    </div>
                  </CardHeader>
                  {orgFeature?.isEnabled && (
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Sub-features:</div>
                        {feature.subFeatures.map((subFeature) => {
                          const orgSubFeature = orgFeature.subFeatures.find(
                            (sf: ISubFeature) => sf.name === subFeature.name
                          );

                          return (
                            <div
                              key={subFeature.name}
                              className="flex items-center justify-between"
                            >
                              <div>
                                <div className="font-medium">
                                  {subFeature.displayName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {subFeature.description}
                                </div>
                              </div>
                              <Switch
                                checked={orgSubFeature?.isEnabled || false}
                                onCheckedChange={(checked) =>
                                  toggleSubFeature(
                                    feature.name,
                                    subFeature.name,
                                    checked
                                  )
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateFeatures}>Update Features</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
