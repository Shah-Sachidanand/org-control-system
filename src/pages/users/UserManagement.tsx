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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Checkbox } from "../../components/ui/checkbox";
import { Switch } from "../../components/ui/switch";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Edit,
  Shield,
  UserCheck,
  UserX,
  Building,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Crown,
  Star,
  Activity,
  Calendar,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
  Info,
  UserPlus,
} from "lucide-react";
import { User, UserRole, Feature, Permission, Organization } from "../../types";
import { HttpClient } from "@/lib/axios";

interface OrganizationWithUsers extends Organization {
  users: User[];
  userCount: number;
  activeUsers: number;
  adminCount: number;
}

export const UserManagement: React.FC = () => {
  const { user: currentUser, hasPermission, canManageRole, hasRole } = useAuth();
  const [organizationsWithUsers, setOrganizationsWithUsers] = useState<OrganizationWithUsers[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "USER" as UserRole,
    organizationId: "",
    isPlatformLevel: false, // For ADMIN users who don't need organization
  });

  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    fetchUsersWithOrganizations();
    fetchFeatures();
  }, []);

  const fetchUsersWithOrganizations = async () => {
    try {
      if (hasRole("SUPERADMIN")) {
        // Fetch all organizations with their users
        const orgsResponse = await HttpClient.get("/organizations");
        const organizations = orgsResponse.data.organizations;

        const orgsWithUsers = await Promise.all(
          organizations.map(async (org: Organization) => {
            try {
              const usersResponse = await HttpClient.get(`/users/organization/${org._id}`);
              const users = usersResponse.data.users || [];
              
              return {
                ...org,
                users,
                userCount: users.length,
                activeUsers: users.filter((u: User) => u.isActive).length,
                adminCount: users.filter((u: User) => u.role === "ORGADMIN").length,
              };
            } catch (error) {
              return {
                ...org,
                users: [],
                userCount: 0,
                activeUsers: 0,
                adminCount: 0,
              };
            }
          })
        );

        // Add platform-level users (ADMIN, SUPERADMIN without organization)
        try {
          const platformUsersResponse = await HttpClient.get("/users/platform");
          const platformUsers = platformUsersResponse.data.users || [];
          
          if (platformUsers.length > 0) {
            const platformOrg = {
              _id: "platform",
              name: "Platform Administration",
              slug: "platform",
              description: "Platform-level administrators and system users",
              features: [],
              settings: { maxUsers: 0, allowedFeatures: [] },
              createdBy: "",
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              users: platformUsers,
              userCount: platformUsers.length,
              activeUsers: platformUsers.filter((u: User) => u.isActive).length,
              adminCount: platformUsers.filter((u: User) => u.role === "ADMIN").length,
            };
            
            orgsWithUsers.unshift(platformOrg); // Add at the beginning
          }
        } catch (error) {
          console.log("No platform users found or error fetching them");
        }

        setOrganizationsWithUsers(orgsWithUsers);
      } else if (hasRole("ADMIN")) {
        // Fetch organizations created by this admin
        const orgsResponse = await HttpClient.get("/organizations");
        const organizations = orgsResponse.data.organizations.filter(
          (org: Organization) => org.createdBy === currentUser?._id
        );

        const orgsWithUsers = await Promise.all(
          organizations.map(async (org: Organization) => {
            try {
              const usersResponse = await HttpClient.get(`/users/organization/${org._id}`);
              const users = usersResponse.data.users || [];
              
              return {
                ...org,
                users,
                userCount: users.length,
                activeUsers: users.filter((u: User) => u.isActive).length,
                adminCount: users.filter((u: User) => u.role === "ORGADMIN").length,
              };
            } catch (error) {
              return {
                ...org,
                users: [],
                userCount: 0,
                activeUsers: 0,
                adminCount: 0,
              };
            }
          })
        );

        setOrganizationsWithUsers(orgsWithUsers);
      } else if (hasRole("ORGADMIN") && currentUser?.organization) {
        // Fetch only current organization users
        const usersResponse = await HttpClient.get(
          `/users/organization/${currentUser.organization._id}`
        );
        const users = usersResponse.data.users || [];
        
        setOrganizationsWithUsers([
          {
            ...currentUser.organization,
            users,
            userCount: users.length,
            activeUsers: users.filter((u: User) => u.isActive).length,
            adminCount: users.filter((u: User) => u.role === "ORGADMIN").length,
          },
        ]);
      }
    } catch (error) {
      toast.error("Failed to fetch users and organizations");
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
      const userData = {
        ...newUser,
        // Don't send organizationId for platform-level users
        organizationId: newUser.isPlatformLevel ? undefined : newUser.organizationId,
      };

      await HttpClient.post("/users", userData);

      toast.success("User created successfully");
      setIsCreateDialogOpen(false);
      setNewUser({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "USER",
        organizationId: "",
        isPlatformLevel: false,
      });
      fetchUsersWithOrganizations();
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
      fetchUsersWithOrganizations();
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

  const toggleOrgExpansion = (orgId: string) => {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(orgId)) {
      newExpanded.delete(orgId);
    } else {
      newExpanded.add(orgId);
    }
    setExpandedOrgs(newExpanded);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "SUPERADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "ADMIN":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "ORGADMIN":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "SUPERADMIN":
        return <Crown className="h-3 w-3" />;
      case "ADMIN":
        return <Star className="h-3 w-3" />;
      case "ORGADMIN":
        return <Shield className="h-3 w-3" />;
      default:
        return <UserCheck className="h-3 w-3" />;
    }
  };

  const getFilteredUsers = (users: User[]) => {
    return users.filter((user) => {
      const matchesSearch = 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  };

  const getTotalStats = () => {
    const totalUsers = organizationsWithUsers.reduce((sum, org) => sum + org.userCount, 0);
    const totalActive = organizationsWithUsers.reduce((sum, org) => sum + org.activeUsers, 0);
    const totalAdmins = organizationsWithUsers.reduce((sum, org) => sum + org.adminCount, 0);
    
    return { totalUsers, totalActive, totalAdmins };
  };

  const getAvailableRoles = () => {
    const roles: UserRole[] = [];
    
    if (hasRole("SUPERADMIN")) {
      // SUPERADMIN can create all roles
      roles.push("USER", "ORGADMIN", "ADMIN");
    } else if (hasRole("ADMIN")) {
      // ADMIN can create ORGADMIN and USER
      roles.push("USER", "ORGADMIN");
    } else if (hasRole("ORGADMIN")) {
      // ORGADMIN can only create USER
      roles.push("USER");
    }
    
    return roles;
  };

  const getAvailableOrganizations = () => {
    // Filter out platform organization for regular organization selection
    return organizationsWithUsers.filter(org => org._id !== "platform");
  };

  const isPlatformLevelRole = (role: UserRole) => {
    return role === "ADMIN" || role === "SUPERADMIN";
  };

  const stats = getTotalStats();

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
            {hasRole("SUPERADMIN") 
              ? "Manage all users across the platform including platform administrators"
              : hasRole("ADMIN")
              ? "Manage users in your organizations"
              : "Manage users in your organization"
            }
          </p>
        </div>
        {hasPermission("user_management", "write", "manage_users") && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the platform or an organization
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Basic Information */}
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
                </div>

                {/* Role Selection */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: UserRole) => {
                        setNewUser((prev) => ({ 
                          ...prev, 
                          role: value,
                          isPlatformLevel: isPlatformLevelRole(value),
                          organizationId: isPlatformLevelRole(value) ? "" : prev.organizationId
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableRoles().map((role) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              {getRoleIcon(role)}
                              {role}
                              {isPlatformLevelRole(role) && (
                                <Badge variant="outline" className="text-xs">
                                  Platform
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Platform Level Toggle for SUPERADMIN */}
                  {hasRole("SUPERADMIN") && (newUser.role === "ADMIN") && (
                    <div className="flex items-center space-x-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <Info className="h-4 w-4 text-blue-600" />
                      <div className="flex-1">
                        <Label htmlFor="isPlatformLevel" className="text-sm font-medium">
                          Platform Administrator
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Platform administrators can create and manage organizations
                        </p>
                      </div>
                      <Switch
                        id="isPlatformLevel"
                        checked={newUser.isPlatformLevel}
                        onCheckedChange={(checked) =>
                          setNewUser((prev) => ({ 
                            ...prev, 
                            isPlatformLevel: checked,
                            organizationId: checked ? "" : prev.organizationId
                          }))
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Organization Selection */}
                {!newUser.isPlatformLevel && !isPlatformLevelRole(newUser.role) && (
                  <div>
                    <Label htmlFor="organization">Organization</Label>
                    <Select
                      value={newUser.organizationId}
                      onValueChange={(value) =>
                        setNewUser((prev) => ({ ...prev, organizationId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableOrganizations().map((org) => (
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
                )}

                {/* Role Information */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Role Capabilities:</p>
                      {newUser.role === "ADMIN" && (
                        <p className="text-muted-foreground">
                          Can create and manage organizations, invite organization administrators
                        </p>
                      )}
                      {newUser.role === "ORGADMIN" && (
                        <p className="text-muted-foreground">
                          Can manage users within their organization, create campaigns and manage merchandise
                        </p>
                      )}
                      {newUser.role === "USER" && (
                        <p className="text-muted-foreground">
                          Access to features based on assigned permissions
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleCreateUser}
                  disabled={
                    !newUser.email || 
                    !newUser.firstName || 
                    !newUser.lastName || 
                    !newUser.password ||
                    (!newUser.isPlatformLevel && !isPlatformLevelRole(newUser.role) && !newUser.organizationId)
                  }
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizationsWithUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              {organizationsWithUsers.filter(org => org._id === "platform").length > 0 ? "Including platform" : "Active organizations"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActive}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdmins}</div>
            <p className="text-xs text-muted-foreground">
              Organization admins
            </p>
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
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={roleFilter}
              onValueChange={(value: UserRole | "all") => setRoleFilter(value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="USER">USER</SelectItem>
                <SelectItem value="ORGADMIN">ORGADMIN</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Organizations with Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organizations & Users
          </CardTitle>
          <CardDescription>
            Expandable view of organizations and their users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organizationsWithUsers.map((org) => {
              const filteredUsers = getFilteredUsers(org.users);
              const isPlatformOrg = org._id === "platform";
              
              return (
                <Card key={org._id} className={`border-l-4 ${isPlatformOrg ? 'border-l-purple-500' : 'border-l-primary'}`}>
                  <Collapsible
                    open={expandedOrgs.has(org._id)}
                    onOpenChange={() => toggleOrgExpansion(org._id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              {expandedOrgs.has(org._id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              {isPlatformOrg ? (
                                <Crown className="h-5 w-5 text-purple-600" />
                              ) : (
                                <Building className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {org.name}
                                {isPlatformOrg && (
                                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                                    Platform
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription>{org.description}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline">
                              {org.userCount} user{org.userCount !== 1 ? "s" : ""}
                            </Badge>
                            <Badge variant="outline">
                              {org.activeUsers} active
                            </Badge>
                            {!isPlatformOrg && (
                              <Badge variant="outline">
                                {org.adminCount} admin{org.adminCount !== 1 ? "s" : ""}
                              </Badge>
                            )}
                            <Badge variant={org.isActive ? "default" : "secondary"}>
                              {org.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {filteredUsers.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredUsers.map((user) => (
                                <TableRow key={user._id}>
                                  <TableCell>
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                        {getRoleIcon(user.role)}
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
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={getRoleBadgeColor(user.role)}>
                                      <div className="flex items-center gap-1">
                                        {getRoleIcon(user.role)}
                                        {user.role}
                                      </div>
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={user.isActive ? "default" : "secondary"}>
                                      {user.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {user.permissions.length} permission{user.permissions.length !== 1 ? "s" : ""}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(user.createdAt).toLocaleDateString()}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {hasPermission("user_management", "write", "manage_permissions") &&
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
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            {searchTerm || roleFilter !== "all" 
                              ? "No users match the current filters"
                              : "No users found in this organization"
                            }
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Permission Management Dialog */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Permissions - {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogTitle>
            <DialogDescription>
              Configure feature and sub-feature access for this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {features.map((feature) => (
              <Card key={feature.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{feature.displayName}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {feature.subFeatures.map((subFeature) => (
                      <div key={subFeature.name} className="space-y-2">
                        <div className="font-medium">{subFeature.displayName}</div>
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
                              <div key={action} className="flex items-center space-x-2">
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
            <Button onClick={handleUpdatePermissions}>Update Permissions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};