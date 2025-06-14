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
import { Checkbox } from "../../components/ui/checkbox";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import {
  UserPlus,
  Mail,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Feature, Permission, Invitation } from "../../types";
import { HttpClient } from "@/lib/axios";

export const InviteAdmin: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
  });

  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    []
  );

  useEffect(() => {
    fetchFeatures();
    fetchAdminInvitations();
  }, []);

  const fetchFeatures = async () => {
    try {
      const response = await HttpClient.get("/features");
      setFeatures(response.data.features);
    } catch (error) {
      toast.error("Failed to fetch features");
    }
  };

  const fetchAdminInvitations = async () => {
    try {
      const response = await HttpClient.get("invitations/admin");
      setInvitations(response.data.invitations);
    } catch (error) {
      toast.error("Failed to fetch invitations");
    }
  };

  const handleSendInvitation = async () => {
    setLoading(true);
    try {
      const response = await HttpClient.post("/invitations/send-admin", {
        email: inviteForm.email,
        firstName: inviteForm.firstName,
        lastName: inviteForm.lastName,
        permissions: selectedPermissions,
      });

      toast.success("Admin invitation sent successfully");
      setInviteForm({ email: "", firstName: "", lastName: "" });
      setSelectedPermissions([]);
      fetchAdminInvitations();

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

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Invite Platform Admin
        </h1>
        <p className="text-muted-foreground">
          Send invitations to new platform administrators
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Invite Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Send Admin Invitation
            </CardTitle>
            <CardDescription>
              Invite a new platform administrator with specific permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={inviteForm.firstName}
                    onChange={(e) =>
                      setInviteForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={inviteForm.lastName}
                    onChange={(e) =>
                      setInviteForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Platform Permissions */}
            <div className="space-y-4">
              <Label>Platform Permissions</Label>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {features
                  .filter(
                    (f) =>
                      f.name === "organization_management" ||
                      f.name === "user_management"
                  )
                  .map((feature) => (
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

            <Button
              onClick={handleSendInvitation}
              disabled={
                loading ||
                !inviteForm.email ||
                !inviteForm.firstName ||
                !inviteForm.lastName
              }
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              {loading ? "Sending..." : "Send Admin Invitation"}
            </Button>
          </CardContent>
        </Card>

        {/* Invitations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Invitations
            </CardTitle>
            <CardDescription>
              Track the status of sent admin invitations
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
                      Role: ADMIN • {invitation.permissions.length} permissions
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
                  </div>
                </div>
              ))}
              {invitations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No admin invitations sent yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
