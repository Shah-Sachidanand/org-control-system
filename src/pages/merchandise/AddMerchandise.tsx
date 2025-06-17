import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { toast } from "sonner";
import { Plus, Package } from "lucide-react";
import { MerchandiseType } from "../../types";
import { HttpClient } from "@/lib/axios";

export const AddMerchandise: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [merchandise, setMerchandise] = useState({
    name: "",
    description: "",
    type: "experience" as MerchandiseType,
    category: "",
    pricing: {
      cost: 0,
      currency: "USD",
      pointsRequired: 0,
    },
    inventory: {
      quantity: 0,
      lowStockThreshold: 10,
      trackInventory: true,
    },
    details: {
      images: [] as string[],
      specifications: [] as { key: string; value: string }[],
      dimensions: {
        length: 0,
        width: 0,
        height: 0,
        weight: 0,
      },
    },
    redemption: {
      isRedeemable: true,
      redemptionInstructions: "",
      expiryDays: 30,
      maxRedemptionsPerUser: 1,
    },
  });

  const [newImage, setNewImage] = useState("");
  const [newSpec, setNewSpec] = useState({ key: "", value: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await HttpClient.post("/merchandise", merchandise);
      toast.success("Merchandise created successfully");
      navigate("/merchandise");
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to create merchandise"
      );
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    if (newImage.trim()) {
      setMerchandise((prev) => ({
        ...prev,
        details: {
          ...prev.details,
          images: [...prev.details.images, newImage.trim()],
        },
      }));
      setNewImage("");
    }
  };

  const removeImage = (index: number) => {
    setMerchandise((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        images: prev.details.images.filter((_, i) => i !== index),
      },
    }));
  };

  const addSpecification = () => {
    if (newSpec.key.trim() && newSpec.value.trim()) {
      setMerchandise((prev) => ({
        ...prev,
        details: {
          ...prev.details,
          specifications: [...prev.details.specifications, { ...newSpec }],
        },
      }));
      setNewSpec({ key: "", value: "" });
    }
  };

  const removeSpecification = (index: number) => {
    setMerchandise((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        specifications: prev.details.specifications.filter(
          (_, i) => i !== index
        ),
      },
    }));
  };

  const merchandiseTypes = [
    { value: "experience", label: "Experience" },
    { value: "loaded_value", label: "Loaded Value" },
    { value: "autograph", label: "Autograph" },
    { value: "merch_level", label: "Merch Level" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Merchandise</h1>
        <p className="text-muted-foreground">
          Create a new merchandise item for your organization
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Set up the basic details of your merchandise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={merchandise.name}
                  onChange={(e) =>
                    setMerchandise((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={merchandise.description}
                  onChange={(e) =>
                    setMerchandise((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={merchandise.type}
                  onValueChange={(value: MerchandiseType) =>
                    setMerchandise((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {merchandiseTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={merchandise.category}
                  onChange={(e) =>
                    setMerchandise((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>
                Set pricing and point requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={merchandise.pricing.cost}
                    onChange={(e) =>
                      setMerchandise((prev) => ({
                        ...prev,
                        pricing: {
                          ...prev.pricing,
                          cost: parseFloat(e.target.value),
                        },
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={merchandise.pricing.currency}
                    onValueChange={(value) =>
                      setMerchandise((prev) => ({
                        ...prev,
                        pricing: { ...prev.pricing, currency: value },
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
                <Label htmlFor="pointsRequired">
                  Points Required (Optional)
                </Label>
                <Input
                  id="pointsRequired"
                  type="number"
                  value={merchandise.pricing.pointsRequired}
                  onChange={(e) =>
                    setMerchandise((prev) => ({
                      ...prev,
                      pricing: {
                        ...prev.pricing,
                        pointsRequired: parseInt(e.target.value),
                      },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>
                Manage stock and inventory settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="trackInventory"
                  checked={merchandise.inventory.trackInventory}
                  onCheckedChange={(checked) =>
                    setMerchandise((prev) => ({
                      ...prev,
                      inventory: { ...prev.inventory, trackInventory: checked },
                    }))
                  }
                />
                <Label htmlFor="trackInventory">Track Inventory</Label>
              </div>

              {merchandise.inventory.trackInventory && (
                <>
                  <div>
                    <Label htmlFor="quantity">Initial Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={merchandise.inventory.quantity}
                      onChange={(e) =>
                        setMerchandise((prev) => ({
                          ...prev,
                          inventory: {
                            ...prev.inventory,
                            quantity: parseInt(e.target.value),
                          },
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="lowStockThreshold">
                      Low Stock Threshold
                    </Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={merchandise.inventory.lowStockThreshold}
                      onChange={(e) =>
                        setMerchandise((prev) => ({
                          ...prev,
                          inventory: {
                            ...prev.inventory,
                            lowStockThreshold: parseInt(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Redemption Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Redemption Settings</CardTitle>
              <CardDescription>
                Configure how this item can be redeemed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isRedeemable"
                  checked={merchandise.redemption.isRedeemable}
                  onCheckedChange={(checked) =>
                    setMerchandise((prev) => ({
                      ...prev,
                      redemption: { ...prev.redemption, isRedeemable: checked },
                    }))
                  }
                />
                <Label htmlFor="isRedeemable">Is Redeemable</Label>
              </div>

              {merchandise.redemption.isRedeemable && (
                <>
                  <div>
                    <Label htmlFor="redemptionInstructions">
                      Redemption Instructions
                    </Label>
                    <Textarea
                      id="redemptionInstructions"
                      value={merchandise.redemption.redemptionInstructions}
                      onChange={(e) =>
                        setMerchandise((prev) => ({
                          ...prev,
                          redemption: {
                            ...prev.redemption,
                            redemptionInstructions: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDays">Expiry Days</Label>
                      <Input
                        id="expiryDays"
                        type="number"
                        value={merchandise.redemption.expiryDays}
                        onChange={(e) =>
                          setMerchandise((prev) => ({
                            ...prev,
                            redemption: {
                              ...prev.redemption,
                              expiryDays: parseInt(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxRedemptionsPerUser">
                        Max Redemptions Per User
                      </Label>
                      <Input
                        id="maxRedemptionsPerUser"
                        type="number"
                        value={merchandise.redemption.maxRedemptionsPerUser}
                        onChange={(e) =>
                          setMerchandise((prev) => ({
                            ...prev,
                            redemption: {
                              ...prev.redemption,
                              maxRedemptionsPerUser: parseInt(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>Add product images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Image URL"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
              />
              <Button type="button" onClick={addImage}>
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {merchandise.details.images.map((image, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="truncate">{image}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeImage(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
            <CardDescription>Add product specifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Specification name"
                value={newSpec.key}
                onChange={(e) =>
                  setNewSpec((prev) => ({ ...prev, key: e.target.value }))
                }
              />
              <Input
                placeholder="Value"
                value={newSpec.value}
                onChange={(e) =>
                  setNewSpec((prev) => ({ ...prev, value: e.target.value }))
                }
              />
              <Button type="button" onClick={addSpecification}>
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {merchandise.details.specifications.map((spec, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span>
                    <strong>{spec.key}:</strong> {spec.value}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSpecification(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/merchandise")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            {loading ? "Creating..." : "Create Merchandise"}
          </Button>
        </div>
      </form>
    </div>
  );
};
