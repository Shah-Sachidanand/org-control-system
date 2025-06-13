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
import { Checkbox } from "../../components/ui/checkbox";
import { toast } from "sonner";
import { Users, Plus, Edit, Shield, UserCheck, UserX } from "lucide-react";
import axios from "axios";
import { User, UserRole, Feature, Permission } from "../../types";
import { HttpClient } from "@/lib/axios";

export const UserManagement: React.FC = () => {
  const { user: currentUser, hasPermission, canManageRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "USER" as UserRole,
  });

  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchFeatures();
  }, []);

  const fetchUsers = async () => {
    try {
      if (currentUser?.organization) {
        const response = await HttpClient.get(
          `/users/organization/${currentUser.organization._id}`
        );
        setUsers(response.data.users);
      } else {
        const response = await HttpClient.get("/users");
        setUsers(response.data.users);
      }
    } catch (error) {
      toast.error("Failed to fetch users");
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

  const handleCreateUser = async () => {
    try {
      await HttpClient.post("/users", {
        ...newUser,
        organizationId: currentUser?.organization?._id,
      });

      toast.success("User created successfully");
      setIsCreateDialogOpen(false);
      setNewUser({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "USER",
      });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create user");
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedUser) return;

    try {
      await HttpClient.put(`/users/${selectedUser._id}/permissions`, {
        permissions: userPermissions,
      });

      toast.success("Permissions updated successfully");
      setIsPermissionDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to update permissions"
      );
    }
  };

  const openPermissionDialog = (user: User) => {
    setSelectedUser(user);
    setUserPermissions(user.permissions);
    setIsPermissionDialogOpen(true);
  };

  const updatePermission = (
    featureName: string,
    subFeature: string,
    action: string,
    checked: boolean
  ) => {
    setUserPermissions((prev) => {
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
        // Remove action if no sub-features use it
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

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "SUPERADMIN":
        return "bg-red-100 text-red-800";
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      case "ORGADMIN":
        return "bg-blue-100 text-blue-800";
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
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users and their permissions in your organization
          </p>
        </div>
        {hasPermission("user_management", "write", "manage_users") && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to your organization
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newUser.firstName}
                      onChange={(e) =>
                        setNewUser((prev) => ({
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
                      value={newUser.lastName}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: UserRole) =>
                      setNewUser((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["USER", "ORGADMIN"] as UserRole[]).map(
                        (role) =>
                          canManageRole(role) && (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateUser}>Create User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Users
          </CardTitle>
          <CardDescription>
            Users in {currentUser?.organization?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role}
                  </Badge>
                  <Badge variant="outline">
                    {user.permissions.length} permissions
                  </Badge>
                  {hasPermission(
                    "user_management",
                    "write",
                    "manage_permissions"
                  ) &&
                    canManageRole(user.role) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPermissionDialog(user)}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Permissions
                      </Button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permission Management Dialog */}
      <Dialog
        open={isPermissionDialogOpen}
        onOpenChange={setIsPermissionDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Permissions - {selectedUser?.firstName}{" "}
              {selectedUser?.lastName}
            </DialogTitle>
            <DialogDescription>
              Configure feature and sub-feature access for this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {features.map((feature) => (
              <Card key={feature.name}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {feature.displayName}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {feature.subFeatures.map((subFeature) => (
                      <div key={subFeature.name} className="space-y-2">
                        <div className="font-medium">
                          {subFeature.displayName}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {subFeature.actions.map((action) => {
                            const isChecked =
                              userPermissions
                                .find((p) => p.feature === feature.name)
                                ?.subFeatures.includes(subFeature.name) &&
                              userPermissions
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
                                  className="text-sm capitalize"
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
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleUpdatePermissions}>
              Update Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
