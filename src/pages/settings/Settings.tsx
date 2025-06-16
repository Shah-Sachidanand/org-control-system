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
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Separator } from "../../components/ui/separator";
import { toast } from "sonner";
import { Bell, Shield, Palette, Globe, Save } from "lucide-react";
import { HttpClient } from "@/lib/axios";

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    promotions: boolean;
    invitations: boolean;
    system: boolean;
  };
  privacy: {
    profileVisible: boolean;
    activityVisible: boolean;
  };
  preferences: {
    theme: "light" | "dark";
    language: string;
    timezone: string;
  };
}

export const Settings: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: true,
      promotions: true,
      invitations: true,
      system: true,
    },
    privacy: {
      profileVisible: true,
      activityVisible: false,
    },
    preferences: {
      theme: "light",
      language: "en",
      timezone: "UTC",
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await HttpClient.get("/settings/user");
      setSettings(response.data.settings);
    } catch (error) {
      toast.error("Failed to fetch settings");
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await HttpClient.put("/api/settings/user", settings);
      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationSetting = (
    key: keyof UserSettings["notifications"],
    value: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const updatePrivacySetting = (
    key: keyof UserSettings["privacy"],
    value: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value,
      },
    }));
  };

  const updatePreferenceSetting = (
    key: keyof UserSettings["preferences"],
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and notification settings
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choose what notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) =>
                    updateNotificationSetting("email", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in browser
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) =>
                    updateNotificationSetting("push", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="promotion-notifications">
                    Promotion Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new promotions
                  </p>
                </div>
                <Switch
                  id="promotion-notifications"
                  checked={settings.notifications.promotions}
                  onCheckedChange={(checked) =>
                    updateNotificationSetting("promotions", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="invitation-notifications">Invitations</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about team invitations
                  </p>
                </div>
                <Switch
                  id="invitation-notifications"
                  checked={settings.notifications.invitations}
                  onCheckedChange={(checked) =>
                    updateNotificationSetting("invitations", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="system-notifications">System Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about system maintenance
                  </p>
                </div>
                <Switch
                  id="system-notifications"
                  checked={settings.notifications.system}
                  onCheckedChange={(checked) =>
                    updateNotificationSetting("system", checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy
            </CardTitle>
            <CardDescription>
              Control your privacy and visibility settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="profile-visible">Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible to other users
                  </p>
                </div>
                <Switch
                  id="profile-visible"
                  checked={settings.privacy.profileVisible}
                  onCheckedChange={(checked) =>
                    updatePrivacySetting("profileVisible", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="activity-visible">Activity Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Show your activity to other users
                  </p>
                </div>
                <Switch
                  id="activity-visible"
                  checked={settings.privacy.activityVisible}
                  onCheckedChange={(checked) =>
                    updatePrivacySetting("activityVisible", checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Preferences
            </CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={settings.preferences.theme}
                  onValueChange={(value: "light" | "dark") =>
                    updatePreferenceSetting("theme", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings.preferences.language}
                  onValueChange={(value) =>
                    updatePreferenceSetting("language", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.preferences.timezone}
                  onValueChange={(value) =>
                    updatePreferenceSetting("timezone", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">
                      Eastern Time
                    </SelectItem>
                    <SelectItem value="America/Chicago">
                      Central Time
                    </SelectItem>
                    <SelectItem value="America/Denver">
                      Mountain Time
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      Pacific Time
                    </SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and organization info
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Account Type:
                </span>
                <span className="text-sm font-medium">{currentUser?.role}</span>
              </div>

              {currentUser?.organization && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Organization:
                  </span>
                  <span className="text-sm font-medium">
                    {currentUser.organization.name}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Member Since:
                </span>
                <span className="text-sm font-medium">
                  {new Date(currentUser?.createdAt || "").toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Permissions:
                </span>
                <span className="text-sm font-medium">
                  {currentUser?.permissions.length || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
};
