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
  Handshake,
  Plus,
  Edit,
  Trash2,
  Globe,
  Mail,
  DollarSign,
  Star,
} from "lucide-react";
import { Partner, PartnerStatus } from "../../types";
import { HttpClient } from "@/lib/axios";

export const PartnerManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
    if (currentUser?.organization) {
      fetchPartners();
    }
  }, [currentUser]);

  const fetchPartners = async () => {
    try {
      if (currentUser?.organization) {
        const response = await HttpClient.get(
          `/partners/organization/${currentUser.organization._id}`
        );
        setPartners(response.data.partners);
      }
    } catch (error) {
      toast.error("Failed to fetch partners");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartner = async () => {
    try {
      await HttpClient.post("/partners", partnerForm);
      toast.success("Partner created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchPartners();
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
      fetchPartners();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update partner");
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    if (!confirm("Are you sure you want to delete this partner?")) return;

    try {
      await HttpClient.delete(`/partners/${partnerId}`);
      toast.success("Partner deleted successfully");
      fetchPartners();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete partner");
    }
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
            Manage sponsorship partners for {currentUser?.organization?.name}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Partner</DialogTitle>
              <DialogDescription>
                Create a new sponsorship partner for promotions
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contractStart">Contract Start Date</Label>
                    <Input
                      id="contractStart"
                      type="date"
                      value={partnerForm.sponsorshipDetails.contractStartDate}
                      onChange={(e) =>
                        setPartnerForm((prev) => ({
                          ...prev,
                          sponsorshipDetails: {
                            ...prev.sponsorshipDetails,
                            contractStartDate: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="contractEnd">Contract End Date</Label>
                    <Input
                      id="contractEnd"
                      type="date"
                      value={partnerForm.sponsorshipDetails.contractEndDate}
                      onChange={(e) =>
                        setPartnerForm((prev) => ({
                          ...prev,
                          sponsorshipDetails: {
                            ...prev.sponsorshipDetails,
                            contractEndDate: e.target.value,
                          },
                        }))
                      }
                    />
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
      </div>

      {/* Partners Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {partners.map((partner) => (
          <Card key={partner._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {partner.logo && (
                      <img
                        src={partner.logo}
                        alt={partner.name}
                        className="w-8 h-8 rounded"
                      />
                    )}
                    <CardTitle className="text-lg">{partner.name}</CardTitle>
                    {partner.isDefault && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {partner.description}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(partner.status)}>
                  {partner.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {partner.website && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {partner.website}
                    </a>
                  </div>
                )}

                {partner.contactInfo.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {partner.contactInfo.email}
                  </div>
                )}

                {partner.sponsorshipDetails.budget && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    {partner.sponsorshipDetails.budget.toLocaleString()}{" "}
                    {partner.sponsorshipDetails.currency}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(partner)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>

                  {!partner.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePartner(partner._id)}
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

      {partners.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-muted-foreground">
              No partners found. Add your first sponsorship partner to get
              started.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
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
            {/* Basic Information */}
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
