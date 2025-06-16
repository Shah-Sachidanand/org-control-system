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
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import {
  UserPlus,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  Building,
} from "lucide-react";
import axios from "axios";
import {
  UserRole,
  Feature,
  Permission,
  Invitation,
  Organization,
} from "../../types";
import { HttpClient } from "@/lib/axios";

export const InviteUser: React.FC = () => {
  const { user: currentUser, canManageRole, hasRole } = useAuth();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "USER" as UserRole,
    organizationId: "",
  });

  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    []
  );

  useEffect(() => {
    fetchFeatures();
    fetchOrganizations();
    if (currentUser?.organization) {
      setInviteForm((prev) => ({
        ...prev,
        organizationId: currentUser.organization._id,
      }));
      fetchInvitations();
    }
  }, [currentUser]);

  useEffect(() => {
    if (inviteForm.organizationId) {
      fetchInvitations();
    }
  }, [inviteForm.organizationId]);

  const fetchFeatures = async () => {
    try {
      const response = await HttpClient.get("/features");
      setFeatures(response.data.features);
    } catch (error) {
      toast.error("Failed to fetch features");
    }
  };

  const fetchOrganizations = async () => {
    try {
      if (hasRole("ADMIN") || hasRole("SUPERADMIN")) {
        const response = await HttpClient.get("/organizations");
        setOrganizations(response.data.organizations);
      }
    } catch (error) {
      toast.error("Failed to fetch organizations");
    }
  };

  const fetchInvitations = async () => {
    try {
      if (currentUser?.organization) {
        const response = await HttpClient.get(
          `/invitations/organization/${currentUser.organization._id}`
        );
        setInvitations(response.data.invitations);
      }
    } catch (error) {
      toast.error("Failed to fetch invitations");
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteForm.organizationId) {
      toast.error("Please select an organization");
      return;
    }

    setLoading(true);
    try {
      const response = await HttpClient.post("/invitations/send", {
        email: inviteForm.email,
        role: inviteForm.role,
        organizationId: inviteForm.organizationId,
        permissions: selectedPermissions,
      });

      toast.success("Invitation sent successfully");
      setInviteForm((prev) => ({ ...prev, email: "" }));
      setSelectedPermissions([]);
      fetchInvitations();

      // Show invitation link
      const invitationLink = response.data.invitation.invitationLink;
      navigator.clipboard.writeText(invitationLink);
      toast.success("Invitation link copied to clipboard");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await HttpClient.post(`/invitations/resend/${invitationId}`);
      toast.success("Invitation resent successfully");
      fetchInvitations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to resend invitation");
    }
  };

  const updatePermission = (
    featureName: string,
    subFeature: string,
    action: string,
    checked: boolean
  ) => {
    setSelectedPermissions((prev) => {
      const newPermissions = [...prev];
      let permission = newPermissions.find((p) => p.feature === featureName);

      if (!permission) {
        permission = {
          feature: featureName,
          subFeatures: [],
          actions: [],
        };
        newPermissions.push(permission);
      }

      if (checked) {
        if (!permission.subFeatures.includes(subFeature)) {
          permission.subFeatures.push(subFeature);
        }
        if (!permission.actions.includes(action as any)) {
          permission.actions.push(action as any);
        }
      } else {
        permission.subFeatures = permission.subFeatures.filter(
          (sf) => sf !== subFeature
        );
        const hasActionInOtherSubFeatures = features
          .find((f) => f.name === featureName)
          ?.subFeatures.some(
            (sf) =>
              permission!.subFeatures.includes(sf.name) &&
              sf.actions.includes(action as any)
          );

        if (!hasActionInOtherSubFeatures) {
          permission.actions = permission.actions.filter((a) => a !== action);
        }
      }

      return newPermissions.filter((p) => p.subFeatures.length > 0);
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "expired":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAvailableRoles = () => {
    const roles: UserRole[] = [];
    if (canManageRole("USER")) roles.push("USER");
    if (canManageRole("ORGADMIN")) roles.push("ORGADMIN");
    return roles;
  };

  const getAvailableOrganizations = () => {
    if (hasRole("SUPERADMIN")) {
      return organizations;
    } else if (hasRole("ADMIN")) {
      return organizations.filter((org) => org.createdBy === currentUser?._id);
    } else if (currentUser?.organization) {
      return [currentUser.organization];
    }
    return [];
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invite Users</h1>
        <p className="text-muted-foreground">
          Send invitations to new users to join organizations
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Invite Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Send Invitation
            </CardTitle>
            <CardDescription>
              Invite a new user to join an organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="organization">Organization</Label>
                <Select
                  value={inviteForm.organizationId}
                  onValueChange={(value) =>
                    setInviteForm((prev) => ({
                      ...prev,
                      organizationId: value,
                    }))
                  }
                  disabled={hasRole("ORGADMIN")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableOrganizations()?.map((org) => (
                      <SelectItem key={org._id} value={org._id}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {org.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value: UserRole) =>
                    setInviteForm((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles().map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Permissions */}
            {inviteForm.organizationId && (
              <div className="space-y-4">
                <Label>Permissions</Label>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {features.map((feature) => (
                    <Card key={feature.name} className="p-4">
                      <div className="space-y-3">
                        <div className="font-medium">{feature.displayName}</div>
                        {feature.subFeatures.map((subFeature) => (
                          <div key={subFeature.name} className="space-y-2 pl-4">
                            <div className="font-medium text-sm">
                              {subFeature.displayName}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {subFeature.actions.map((action) => {
                                const isChecked =
                                  selectedPermissions
                                    .find((p) => p.feature === feature.name)
                                    ?.subFeatures.includes(subFeature.name) &&
                                  selectedPermissions
                                    .find((p) => p.feature === feature.name)
                                    ?.actions.includes(action);

                                return (
                                  <div
                                    key={action}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`${feature.name}-${subFeature.name}-${action}`}
                                      checked={isChecked}
                                      onCheckedChange={(checked) =>
                                        updatePermission(
                                          feature.name,
                                          subFeature.name,
                                          action,
                                          checked as boolean
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor={`${feature.name}-${subFeature.name}-${action}`}
                                      className="text-xs capitalize"
                                    >
                                      {action}
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleSendInvitation}
              disabled={
                loading || !inviteForm.email || !inviteForm.organizationId
              }
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </CardContent>
        </Card>

        {/* Invitations List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Invitations</CardTitle>
            <CardDescription>
              Track the status of sent invitations
              {inviteForm.organizationId && (
                <span className="block mt-1">
                  for{" "}
                  {
                    getAvailableOrganizations().find(
                      (org) => org._id === inviteForm.organizationId
                    )?.name
                  }
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{invitation.email}</div>
                    <div className="text-sm text-muted-foreground">
                      Role: {invitation.role} • {invitation.permissions.length}{" "}
                      permissions
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Invited{" "}
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(invitation.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(invitation.status)}
                        {invitation.status}
                      </div>
                    </Badge>
                    {invitation.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvitation(invitation._id)}
                      >
                        Resend
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {invitations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {inviteForm.organizationId
                    ? "No invitations sent yet for this organization"
                    : "Select an organization to view invitations"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
