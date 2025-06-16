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
import { toast } from "sonner";
import {
  Handshake,
  Plus,
  Edit,
  Trash2,
  Globe,
  Mail,
  Phone,
  DollarSign,
  Star,
  ChevronDown,
  ChevronRight,
  Building,
  Users,
} from "lucide-react";
import { Partner, PartnerStatus, Organization } from "../../types";
import { HttpClient } from "@/lib/axios";

interface OrganizationWithPartners extends Organization {
  partners: Partner[];
}

export const PartnerManagement: React.FC = () => {
  const { user: currentUser, hasRole } = useAuth();
  const [organizationsWithPartners, setOrganizationsWithPartners] = useState<
    OrganizationWithPartners[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());

  const [partnerForm, setPartnerForm] = useState({
    name: "",
    description: "",
    logo: "",
    website: "",
    contactInfo: {
      email: "",
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
      },
    },
    status: "active" as PartnerStatus,
    sponsorshipDetails: {
      budget: 0,
      currency: "USD",
      contractStartDate: "",
      contractEndDate: "",
      terms: "",
    },
  });

  useEffect(() => {
    fetchOrganizationsWithPartners();
  }, [currentUser]);

  const fetchOrganizationsWithPartners = async () => {
    try {
      if (hasRole("SUPERADMIN")) {
        // Fetch all organizations
        const orgsResponse = await HttpClient.get("/organizations");
        const organizations = orgsResponse.data.organizations;

        // Fetch partners for each organization
        const orgsWithPartners = await Promise.all(
          organizations.map(async (org: Organization) => {
            try {
              const partnersResponse = await HttpClient.get(
                `/partners/organization/${org._id}`
              );
              return {
                ...org,
                partners: partnersResponse.data.partners || [],
              };
            } catch (error) {
              return {
                ...org,
                partners: [],
              };
            }
          })
        );

        setOrganizationsWithPartners(orgsWithPartners);
      } else if (hasRole("ADMIN")) {
        // Fetch organizations created by this admin
        const orgsResponse = await HttpClient.get("/organizations");
        const organizations = orgsResponse.data.organizations;

        const orgsWithPartners = await Promise.all(
          organizations.map(async (org: Organization) => {
            try {
              const partnersResponse = await HttpClient.get(
                `/partners/organization/${org._id}`
              );
              return {
                ...org,
                partners: partnersResponse.data.partners || [],
              };
            } catch (error) {
              return {
                ...org,
                partners: [],
              };
            }
          })
        );

        setOrganizationsWithPartners(orgsWithPartners);
      } else if (hasRole("ORGADMIN") && currentUser?.organization) {
        // Fetch only current organization
        const partnersResponse = await HttpClient.get(
          `/partners/organization/${currentUser.organization._id}`
        );
        setOrganizationsWithPartners([
          {
            ...currentUser.organization,
            partners: partnersResponse.data.partners || [],
          },
        ]);
      }
    } catch (error) {
      toast.error("Failed to fetch organizations and partners");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartner = async () => {
    try {
      await HttpClient.post("/partners", {
        ...partnerForm,
        organizationId: selectedOrgId,
      });

      toast.success("Partner created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchOrganizationsWithPartners();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create partner");
    }
  };

  const handleUpdatePartner = async () => {
    if (!selectedPartner) return;

    try {
      await HttpClient.put(`/partners/${selectedPartner._id}`, partnerForm);

      toast.success("Partner updated successfully");
      setIsEditDialogOpen(false);
      setSelectedPartner(null);
      resetForm();
      fetchOrganizationsWithPartners();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update partner");
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    if (!confirm("Are you sure you want to delete this partner?")) return;

    try {
      await HttpClient.delete(`/partners/${partnerId}`);
      toast.success("Partner deleted successfully");
      fetchOrganizationsWithPartners();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete partner");
    }
  };

  const openCreateDialog = (orgId: string) => {
    setSelectedOrgId(orgId);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (partner: Partner) => {
    setSelectedPartner(partner);
    setPartnerForm({
      name: partner.name,
      description: partner.description || "",
      logo: partner.logo || "",
      website: partner.website || "",
      contactInfo: {
        email: partner.contactInfo.email || "",
        phone: partner.contactInfo.phone || "",
        address: {
          street: partner.contactInfo.address?.street || "",
          city: partner.contactInfo.address?.city || "",
          state: partner.contactInfo.address?.state || "",
          country: partner.contactInfo.address?.country || "",
          zipCode: partner.contactInfo.address?.zipCode || "",
        },
      },
      status: partner.status,
      sponsorshipDetails: {
        budget: partner.sponsorshipDetails.budget || 0,
        currency: partner.sponsorshipDetails.currency || "USD",
        contractStartDate: partner.sponsorshipDetails.contractStartDate
          ? new Date(partner.sponsorshipDetails.contractStartDate)
              .toISOString()
              .split("T")[0]
          : "",
        contractEndDate: partner.sponsorshipDetails.contractEndDate
          ? new Date(partner.sponsorshipDetails.contractEndDate)
              .toISOString()
              .split("T")[0]
          : "",
        terms: partner.sponsorshipDetails.terms || "",
      },
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setPartnerForm({
      name: "",
      description: "",
      logo: "",
      website: "",
      contactInfo: {
        email: "",
        phone: "",
        address: {
          street: "",
          city: "",
          state: "",
          country: "",
          zipCode: "",
        },
      },
      status: "active",
      sponsorshipDetails: {
        budget: 0,
        currency: "USD",
        contractStartDate: "",
        contractEndDate: "",
        terms: "",
      },
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

  const getStatusColor = (status: PartnerStatus) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTotalPartners = () => {
    return organizationsWithPartners.reduce(
      (total, org) => total + org.partners.length,
      0
    );
  };

  const getActivePartners = () => {
    return organizationsWithPartners.reduce(
      (total, org) =>
        total + org.partners.filter((p) => p.status === "active").length,
      0
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
            Partner Management
          </h1>
          <p className="text-muted-foreground">
            {hasRole("SUPERADMIN")
              ? "Manage all organization partners across the platform"
              : hasRole("ADMIN")
              ? "Manage partners for your organizations"
              : `Manage partners for ${currentUser?.organization?.name}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizationsWithPartners.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Partners
            </CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalPartners()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Partners
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getActivePartners()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {organizationsWithPartners
                .reduce(
                  (total, org) =>
                    total +
                    org.partners.reduce(
                      (orgTotal, partner) =>
                        orgTotal + (partner.sponsorshipDetails.budget || 0),
                      0
                    ),
                  0
                )
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations with Partners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organizations & Partners
          </CardTitle>
          <CardDescription>
            Expandable view of organizations and their associated partners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organizationsWithPartners.map((org) => (
              <Card key={org._id} className="border-l-4 border-l-primary">
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
                            <Building className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {org.name}
                            </CardTitle>
                            <CardDescription>{org.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline">
                            {org.partners.length} partner
                            {org.partners.length !== 1 ? "s" : ""}
                          </Badge>
                          <Badge
                            variant={org.isActive ? "default" : "secondary"}
                          >
                            {org.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCreateDialog(org._id);
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Partner
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {org.partners.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Partner</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Budget</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {org.partners.map((partner) => (
                              <TableRow key={partner._id}>
                                <TableCell>
                                  <div className="flex items-center space-x-3">
                                    {partner.logo && (
                                      <img
                                        src={partner.logo}
                                        alt={partner.name}
                                        className="w-8 h-8 rounded"
                                      />
                                    )}
                                    <div>
                                      <div className="font-medium flex items-center gap-2">
                                        {partner.name}
                                        {partner.isDefault && (
                                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                        )}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {partner.description}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {partner.contactInfo.email && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-3 w-3" />
                                        {partner.contactInfo.email}
                                      </div>
                                    )}
                                    {partner.contactInfo.phone && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-3 w-3" />
                                        {partner.contactInfo.phone}
                                      </div>
                                    )}
                                    {partner.website && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Globe className="h-3 w-3" />
                                        <a
                                          href={partner.website}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="hover:underline"
                                        >
                                          Website
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {partner.sponsorshipDetails.budget ? (
                                    <div className="text-sm">
                                      <div className="font-medium">
                                        {partner.sponsorshipDetails.budget.toLocaleString()}{" "}
                                        {partner.sponsorshipDetails.currency}
                                      </div>
                                      {partner.sponsorshipDetails
                                        .contractStartDate &&
                                        partner.sponsorshipDetails
                                          .contractEndDate && (
                                          <div className="text-muted-foreground">
                                            {new Date(
                                              partner.sponsorshipDetails.contractStartDate
                                            ).toLocaleDateString()}{" "}
                                            -{" "}
                                            {new Date(
                                              partner.sponsorshipDetails.contractEndDate
                                            ).toLocaleDateString()}
                                          </div>
                                        )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      -
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={getStatusColor(partner.status)}
                                  >
                                    {partner.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openEditDialog(partner)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    {!partner.isDefault && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleDeletePartner(partner._id)
                                        }
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No partners found for this organization.
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Partner Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Partner</DialogTitle>
            <DialogDescription>
              Create a new sponsorship partner for the selected organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Partner Name</Label>
                  <Input
                    id="name"
                    value={partnerForm.name}
                    onChange={(e) =>
                      setPartnerForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={partnerForm.status}
                    onValueChange={(value: PartnerStatus) =>
                      setPartnerForm((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={partnerForm.description}
                  onChange={(e) =>
                    setPartnerForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input
                    id="logo"
                    value={partnerForm.logo}
                    onChange={(e) =>
                      setPartnerForm((prev) => ({
                        ...prev,
                        logo: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={partnerForm.website}
                    onChange={(e) =>
                      setPartnerForm((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={partnerForm.contactInfo.email}
                    onChange={(e) =>
                      setPartnerForm((prev) => ({
                        ...prev,
                        contactInfo: {
                          ...prev.contactInfo,
                          email: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={partnerForm.contactInfo.phone}
                    onChange={(e) =>
                      setPartnerForm((prev) => ({
                        ...prev,
                        contactInfo: {
                          ...prev.contactInfo,
                          phone: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Sponsorship Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Sponsorship Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={partnerForm.sponsorshipDetails.budget}
                    onChange={(e) =>
                      setPartnerForm((prev) => ({
                        ...prev,
                        sponsorshipDetails: {
                          ...prev.sponsorshipDetails,
                          budget: parseFloat(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={partnerForm.sponsorshipDetails.currency}
                    onValueChange={(value) =>
                      setPartnerForm((prev) => ({
                        ...prev,
                        sponsorshipDetails: {
                          ...prev.sponsorshipDetails,
                          currency: value,
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="terms">Contract Terms</Label>
                <Textarea
                  id="terms"
                  value={partnerForm.sponsorshipDetails.terms}
                  onChange={(e) =>
                    setPartnerForm((prev) => ({
                      ...prev,
                      sponsorshipDetails: {
                        ...prev.sponsorshipDetails,
                        terms: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreatePartner}>Create Partner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Partner Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Partner</DialogTitle>
            <DialogDescription>
              Update partner information and sponsorship details
            </DialogDescription>
          </DialogHeader>
          {/* Same form content as create dialog */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editName">Partner Name</Label>
                  <Input
                    id="editName"
                    value={partnerForm.name}
                    onChange={(e) =>
                      setPartnerForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editStatus">Status</Label>
                  <Select
                    value={partnerForm.status}
                    onValueChange={(value: PartnerStatus) =>
                      setPartnerForm((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={partnerForm.description}
                  onChange={(e) =>
                    setPartnerForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdatePartner}>Update Partner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
