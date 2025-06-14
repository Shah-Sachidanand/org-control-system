import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import {
  Home,
  Building,
  Users,
  Gift,
  Megaphone,
  ShieldCheck,
  UserPlus,
  Eye,
  Plus,
  Settings,
  ChevronDown,
  ChevronRight,
  Layers,
  Target,
  Package,
  Mail,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user, hasPermission, hasRole } = useAuth();
  const location = useLocation();
  const [openSections, setOpenSections] = React.useState<string[]>([
    "promotions",
    "merchandise",
    "users",
  ]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: Home,
      show: true,
    },
    {
      title: "Organizations",
      href: "/organizations",
      icon: Building,
      show: hasRole("ADMIN") || hasRole("SUPERADMIN"),
      badge: hasRole("SUPERADMIN") ? "All" : "Mine",
    },
    {
      title: "Features",
      href: "/features",
      icon: Layers,
      show: hasRole("SUPERADMIN"),
      badge: "System",
    },
    {
      title: "Promotions",
      icon: Megaphone,
      show: hasPermission("promotion", "read"),
      section: "promotions",
      children: [
        {
          title: "Dashboard",
          href: "/promotions",
          icon: Target,
          show: hasPermission("promotion", "read"),
        },
        {
          title: "View All",
          href: "/promotions/view",
          icon: Eye,
          show: hasPermission("promotion", "read"),
        },
        {
          title: "Create Campaign",
          href: "/promotions/create",
          icon: Plus,
          show: hasPermission("promotion", "write"),
        },
      ],
    },
    {
      title: "Merchandise",
      icon: Gift,
      show: hasPermission("merchandise", "read"),
      section: "merchandise",
      children: [
        {
          title: "Dashboard",
          href: "/merchandise",
          icon: Package,
          show: hasPermission("merchandise", "read"),
        },
        {
          title: "View Inventory",
          href: "/merchandise/view",
          icon: Eye,
          show: hasPermission("merchandise", "read"),
        },
        {
          title: "Add Item",
          href: "/merchandise/add",
          icon: Plus,
          show: hasPermission("merchandise", "write"),
        },
      ],
    },
    {
      title: "Users",
      icon: Users,
      show:
        hasPermission("user_management", "read") ||
        ["ORGADMIN", "ADMIN", "SUPERADMIN"].includes(user?.role || ""),
      section: "users",
      children: [
        {
          title: "Manage Users",
          href: "/users",
          icon: Users,
          show: hasPermission("user_management", "read"),
        },
        {
          title: "Invite User",
          href: "/users/invite",
          icon: UserPlus,
          show:
            hasPermission("user_management", "write") ||
            hasRole("ADMIN") ||
            hasRole("SUPERADMIN"),
        },
        {
          title: "Invite Admin",
          href: "/admin/invite",
          icon: Mail,
          show: hasRole("SUPERADMIN"),
          badge: "Platform",
        },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div
      className={cn(
        "flex h-full w-64 flex-col border-r bg-background",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/" className="flex items-center space-x-2">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div className="flex flex-col">
            <span className="font-bold text-lg">OrgControl</span>
            <span className="text-xs text-muted-foreground">
              {user?.organization?.name || "Platform"}
            </span>
          </div>
        </Link>
      </div>

      {/* User Info */}
      <div className="border-b p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {user?.role}
              </Badge>
              {user?.organization && (
                <span className="text-xs text-muted-foreground truncate">
                  {user.organization.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            if (!item.show) return null;

            if (item.children) {
              const isOpen = openSections.includes(item.section!);
              const hasActiveChild = item.children.some(
                (child) => child.href && isActive(child.href)
              );

              return (
                <Collapsible
                  key={item.title}
                  open={isOpen}
                  onOpenChange={() => toggleSection(item.section!)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between px-3 py-2 h-auto",
                        (isOpen || hasActiveChild) &&
                          "bg-accent text-accent-foreground"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {item.title}
                        </span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pl-6 pt-1">
                    {item.children.map((child) => {
                      if (!child.show || !child.href) return null;

                      return (
                        <Button
                          key={child.href}
                          variant="ghost"
                          size="sm"
                          asChild
                          className={cn(
                            "w-full justify-start px-3 py-2 h-auto",
                            isActive(child.href) &&
                              "bg-accent text-accent-foreground"
                          )}
                        >
                          <Link to={child.href}>
                            <child.icon className="h-4 w-4 mr-3" />
                            <span className="text-sm">{child.title}</span>
                            {child.badge && (
                              <Badge
                                variant="secondary"
                                className="ml-auto text-xs"
                              >
                                {child.badge}
                              </Badge>
                            )}
                          </Link>
                        </Button>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            return (
              <Button
                key={item.href}
                variant="ghost"
                asChild
                className={cn(
                  "w-full justify-start px-3 py-2 h-auto",
                  item.href &&
                    isActive(item.href) &&
                    "bg-accent text-accent-foreground"
                )}
              >
                <Link to={item.href!}>
                  <item.icon className="h-4 w-4 mr-3" />
                  <span className="text-sm font-medium">{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Settings */}
      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          asChild
        >
          <Link to="/settings">
            <Settings className="h-4 w-4 mr-3" />
            <span className="text-sm">Settings</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};
