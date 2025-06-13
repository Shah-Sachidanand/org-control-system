import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Calendar } from "../../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { toast } from "sonner";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import { PromotionType } from "../../types";

export const CreatePromotion: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [promotion, setPromotion] = useState({
    title: "",
    description: "",
    type: "email" as PromotionType,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    content: {
      subject: "",
      body: "",
      imageUrl: "",
      videoUrl: "",
      ctaText: "",
      ctaUrl: "",
    },
    settings: {
      maxRedemptions: 1000,
      discountType: "percentage" as "percentage" | "fixed" | "free_shipping",
      discountValue: 10,
      minimumPurchase: 0,
    },
    targetAudience: {
      ageRange: { min: 18, max: 65 },
      location: [] as string[],
      interests: [] as string[],
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post("/api/promotions", promotion);
      toast.success("Promotion created successfully");
      navigate("/promotions");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create promotion");
    } finally {
      setLoading(false);
    }
  };

  const promotionTypes = [
    { value: "email", label: "Email Campaign" },
    { value: "unique_code", label: "Unique Code" },
    { value: "qr_code", label: "QR Code" },
    { value: "video", label: "Video Campaign" },
    { value: "joining_bonus", label: "Joining Bonus" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Promotion</h1>
        <p className="text-muted-foreground">
          Create a new promotional campaign for your organization
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Set up the basic details of your promotion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={promotion.title}
                  onChange={(e) =>
                    setPromotion((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={promotion.description}
                  onChange={(e) =>
                    setPromotion((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="type">Promotion Type</Label>
                <Select
                  value={promotion.type}
                  onValueChange={(value: PromotionType) =>
                    setPromotion((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {promotionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(promotion.startDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={promotion.startDate}
                        onSelect={(date) =>
                          date &&
                          setPromotion((prev) => ({ ...prev, startDate: date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(promotion.endDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={promotion.endDate}
                        onSelect={(date) =>
                          date &&
                          setPromotion((prev) => ({ ...prev, endDate: date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>
                Configure the promotional content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {promotion.type === "email" && (
                <>
                  <div>
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      value={promotion.content.subject}
                      onChange={(e) =>
                        setPromotion((prev) => ({
                          ...prev,
                          content: { ...prev.content, subject: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="body">Email Body</Label>
                    <Textarea
                      id="body"
                      value={promotion.content.body}
                      onChange={(e) =>
                        setPromotion((prev) => ({
                          ...prev,
                          content: { ...prev.content, body: e.target.value },
                        }))
                      }
                      rows={4}
                    />
                  </div>
                </>
              )}

              {promotion.type === "video" && (
                <div>
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    value={promotion.content.videoUrl}
                    onChange={(e) =>
                      setPromotion((prev) => ({
                        ...prev,
                        content: { ...prev.content, videoUrl: e.target.value },
                      }))
                    }
                  />
                </div>
              )}

              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={promotion.content.imageUrl}
                  onChange={(e) =>
                    setPromotion((prev) => ({
                      ...prev,
                      content: { ...prev.content, imageUrl: e.target.value },
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="ctaText">Call to Action Text</Label>
                <Input
                  id="ctaText"
                  value={promotion.content.ctaText}
                  onChange={(e) =>
                    setPromotion((prev) => ({
                      ...prev,
                      content: { ...prev.content, ctaText: e.target.value },
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="ctaUrl">Call to Action URL</Label>
                <Input
                  id="ctaUrl"
                  value={promotion.content.ctaUrl}
                  onChange={(e) =>
                    setPromotion((prev) => ({
                      ...prev,
                      content: { ...prev.content, ctaUrl: e.target.value },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure promotion settings and discounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="maxRedemptions">Max Redemptions</Label>
                <Input
                  id="maxRedemptions"
                  type="number"
                  value={promotion.settings.maxRedemptions}
                  onChange={(e) =>
                    setPromotion((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        maxRedemptions: parseInt(e.target.value),
                      },
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  value={promotion.settings.discountType}
                  onValueChange={(
                    value: "percentage" | "fixed" | "free_shipping"
                  ) =>
                    setPromotion((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, discountType: value },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {promotion.settings.discountType !== "free_shipping" && (
                <div>
                  <Label htmlFor="discountValue">
                    Discount Value{" "}
                    {promotion.settings.discountType === "percentage"
                      ? "(%)"
                      : "($)"}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={promotion.settings.discountValue}
                    onChange={(e) =>
                      setPromotion((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          discountValue: parseFloat(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
              )}

              <div>
                <Label htmlFor="minimumPurchase">Minimum Purchase ($)</Label>
                <Input
                  id="minimumPurchase"
                  type="number"
                  value={promotion.settings.minimumPurchase}
                  onChange={(e) =>
                    setPromotion((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        minimumPurchase: parseFloat(e.target.value),
                      },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Target Audience */}
          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
              <CardDescription>
                Define who should see this promotion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minAge">Min Age</Label>
                  <Input
                    id="minAge"
                    type="number"
                    value={promotion.targetAudience.ageRange.min}
                    onChange={(e) =>
                      setPromotion((prev) => ({
                        ...prev,
                        targetAudience: {
                          ...prev.targetAudience,
                          ageRange: {
                            ...prev.targetAudience.ageRange,
                            min: parseInt(e.target.value),
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="maxAge">Max Age</Label>
                  <Input
                    id="maxAge"
                    type="number"
                    value={promotion.targetAudience.ageRange.max}
                    onChange={(e) =>
                      setPromotion((prev) => ({
                        ...prev,
                        targetAudience: {
                          ...prev.targetAudience,
                          ageRange: {
                            ...prev.targetAudience.ageRange,
                            max: parseInt(e.target.value),
                          },
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/promotions")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            {loading ? "Creating..." : "Create Promotion"}
          </Button>
        </div>
      </form>
    </div>
  );
};
