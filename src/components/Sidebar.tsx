import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
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
  Handshake,
  User,
  LogOut,
  AlertTriangle,
  Lock,
  Info,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Alert, AlertDescription } from "./ui/alert";

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { 
    user, 
    hasPermission, 
    hasRole, 
    hasFeatureAccess, 
    validateOrganizationFeatureAccess,
    getAccessDeniedReason,
    logout 
  } = useAuth();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const [openSections, setOpenSections] = useState<string[]>([
    "promotions",
    "merchandise",
    "users",
  ]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  type NavigationChild = {
    title: string;
    href?: string;
    icon: React.ElementType;
    show: boolean;
    badge?: string;
    disabled?: boolean;
    disabledReason?: string;
  };

  type NavigationItem = {
    title: string;
    href?: string;
    icon: React.ElementType;
    show: boolean;
    badge?: string;
    section?: string;
    children?: NavigationChild[];
    disabled?: boolean;
    disabledReason?: string;
  };

  // Enhanced feature availability checking with comprehensive validation
  const checkFeatureAvailability = (featureName: string, subFeatureName?: string) => {
    const hasUserPermission = hasPermission(featureName, "read", subFeatureName);
    const hasOrgFeature = validateOrganizationFeatureAccess(featureName, subFeatureName);
    const isAvailable = hasUserPermission && hasOrgFeature;
    
    let reason = "";
    if (!isAvailable) {
      reason = getAccessDeniedReason(featureName, "read", subFeatureName);
    }
    
    return { isAvailable, reason };
  };

  const navigationItems: NavigationItem[] = [
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
      show: hasFeatureAccess("organization_management", "USER_ROLE"),
      badge: hasRole("SUPERADMIN") ? "All" : "Mine",
    },
    {
      title: "Features",
      href: "/features",
      icon: Layers,
      show: hasFeatureAccess("system_management", "SYSTEM"),
      badge: "System",
    },
    {
      title: "Partners",
      href: "/partners",
      icon: Handshake,
      show: hasFeatureAccess("partner_management", "ORGANIZATION"),
      badge: "Sponsors",
      ...(() => {
        const { isAvailable, reason } = checkFeatureAvailability("partner_management");
        return { disabled: !isAvailable, disabledReason: reason };
      })(),
    },
    {
      title: "Promotions",
      icon: Megaphone,
      show: hasFeatureAccess("promotion", "ORGANIZATION"),
      section: "promotions",
      ...(() => {
        const { isAvailable, reason } = checkFeatureAvailability("promotion");
        return { disabled: !isAvailable, disabledReason: reason };
      })(),
      children: [
        {
          title: "Dashboard",
          href: "/promotions",
          icon: Target,
          show: hasFeatureAccess("promotion", "ORGANIZATION"),
          ...(() => {
            const { isAvailable, reason } = checkFeatureAvailability("promotion");
            return { disabled: !isAvailable, disabledReason: reason };
          })(),
        },
        {
          title: "View All",
          href: "/promotions/view",
          icon: Eye,
          show: hasFeatureAccess("promotion", "ORGANIZATION"),
          ...(() => {
            const { isAvailable, reason } = checkFeatureAvailability("promotion");
            return { disabled: !isAvailable, disabledReason: reason };
          })(),
        },
        {
          title: "Create Campaign",
          href: "/promotions/create",
          icon: Plus,
          show: hasPermission("promotion", "write"),
          ...(() => {
            const { isAvailable, reason } = checkFeatureAvailability("promotion");
            return { disabled: !isAvailable, disabledReason: reason };
          })(),
        },
      ],
    },
    {
      title: "Merchandise",
      icon: Gift,
      show: hasFeatureAccess("merchandise", "ORGANIZATION"),
      section: "merchandise",
      ...(() => {
        const { isAvailable, reason } = checkFeatureAvailability("merchandise");
        return { disabled: !isAvailable, disabledReason: reason };
      })(),
      children: [
        {
          title: "Dashboard",
          href: "/merchandise",
          icon: Package,
          show: hasFeatureAccess("merchandise", "ORGANIZATION"),
          ...(() => {
            const { isAvailable, reason } = checkFeatureAvailability("merchandise");
            return { disabled: !isAvailable, disabledReason: reason };
          })(),
        },
        {
          title: "View Inventory",
          href: "/merchandise/view",
          icon: Eye,
          show: hasFeatureAccess("merchandise", "ORGANIZATION"),
          ...(() => {
            const { isAvailable, reason } = checkFeatureAvailability("merchandise");
            return { disabled: !isAvailable, disabledReason: reason };
          })(),
        },
        {
          title: "Add Item",
          href: "/merchandise/add",
          icon: Plus,
          show: hasPermission("merchandise", "write"),
          ...(() => {
            const { isAvailable, reason } = checkFeatureAvailability("merchandise");
            return { disabled: !isAvailable, disabledReason: reason };
          })(),
        },
      ],
    },
    {
      title: "Users",
      icon: Users,
      show:
        hasFeatureAccess("user_management", "ORGANIZATION") ||
        hasFeatureAccess("organization_management", "USER_ROLE"),
      section: "users",
      children: [
        {
          title: "Manage Users",
          href: "/users",
          icon: Users,
          show:
            hasFeatureAccess("user_management", "ORGANIZATION") ||
            hasFeatureAccess("organization_management", "USER_ROLE"),
          ...(() => {
            const { isAvailable, reason } = checkFeatureAvailability("user_management");
            return { disabled: !isAvailable, disabledReason: reason };
          })(),
        },
        {
          title: "Invite User",
          href: "/users/invite",
          icon: UserPlus,
          show:
            hasPermission("user_management", "write") ||
            hasPermission("organization_management", "write"),
          ...(() => {
            const { isAvailable, reason } = checkFeatureAvailability("user_management");
            return { disabled: !isAvailable, disabledReason: reason };
          })(),
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

  const renderNavigationItem = (item: NavigationItem | NavigationChild) => {
    const content = (
      <div className={cn(
        "flex items-center space-x-3 transition-all duration-200",
        isCollapsed && "justify-center"
      )}>
        <item.icon className={cn(
          "h-4 w-4 transition-all duration-200",
          hoveredItem === item.title && "scale-110"
        )} />
        {!isCollapsed && (
          <>
            <span className="text-sm font-medium transition-all duration-200">
              {item.title}
            </span>
            {item.badge && (
              <Badge variant="secondary" className="text-xs transition-all duration-200">
                {item.badge}
              </Badge>
            )}
            {item.disabled && (
              <div className="flex items-center">
                <Lock className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </>
        )}
      </div>
    );

    if (item.disabled && item.disabledReason) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="opacity-50 cursor-not-allowed">
                {content}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Feature Disabled</p>
                  <p className="text-sm text-muted-foreground">{item.disabledReason}</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  const getOrganizationStatus = () => {
    if (!user) return null;

    if (user.role === "SUPERADMIN") {
      return { status: "Platform Admin", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
    }

    if (user.role === "ADMIN") {
      return { status: "Platform Admin", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" };
    }

    if (!user.organization) {
      return { status: "No Organization", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
    }

    const enabledFeatures = user.organization.features?.filter(f => f.isEnabled).length || 0;
    const totalFeatures = user.organization.features?.length || 0;

    return {
      status: `${enabledFeatures}/${totalFeatures} Features`,
      color: enabledFeatures === totalFeatures 
        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    };
  };

  const orgStatus = getOrganizationStatus();

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-background transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo & Collapse Toggle */}
      <div className="flex h-16 items-center border-b px-6 relative">
        <Link to="/" className={cn(
          "flex items-center space-x-2 transition-all duration-200",
          isCollapsed && "justify-center w-full"
        )}>
          <ShieldCheck className="h-8 w-8 text-primary" />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg">OrgControl</span>
              <span className="text-xs text-muted-foreground">
                {user?.organization?.name || "Platform"}
              </span>
            </div>
          )}
        </Link>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border bg-background hover:bg-accent transition-all duration-200",
            "shadow-md hover:shadow-lg"
          )}
        >
          <ChevronLeft className={cn(
            "h-3 w-3 transition-transform duration-200",
            isCollapsed && "rotate-180"
          )} />
        </Button>
      </div>

      {/* User Info with Enhanced Status */}
      <div className={cn(
        "border-b p-4 transition-all duration-200",
        isCollapsed ? "px-2" : "px-4"
      )}>
        <div className={cn(
          "flex items-center space-x-3",
          isCollapsed && "justify-center"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {user?.role}
                </Badge>
                {orgStatus && (
                  <Badge className={`text-xs ${orgStatus.color}`}>
                    {orgStatus.status}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Organization status alert */}
        {!isCollapsed && user && !user.organization && user.role !== "SUPERADMIN" && user.role !== "ADMIN" && (
          <Alert className="mt-3">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              No organization assigned. Contact your administrator.
            </AlertDescription>
          </Alert>
        )}
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
                  open={isOpen && !isCollapsed}
                  onOpenChange={() => !isCollapsed && toggleSection(item.section!)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between px-3 py-2 h-auto transition-all duration-200 hover:bg-accent/70",
                        (isOpen || hasActiveChild) && "bg-accent text-accent-foreground",
                        item.disabled && "opacity-50 cursor-not-allowed",
                        isCollapsed && "justify-center px-2"
                      )}
                      disabled={item.disabled}
                      onMouseEnter={() => setHoveredItem(item.title)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {renderNavigationItem(item)}
                      {!item.disabled && !isCollapsed && (
                        <div className="transition-transform duration-200">
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pl-6 pt-1">
                    {item.children.map((child) => {
                      if (!child.show || !child.href) return null;

                      if (child.disabled) {
                        return (
                          <div key={child.href} className="px-3 py-2">
                            {renderNavigationItem(child)}
                          </div>
                        );
                      }

                      return (
                        <Button
                          key={child.href}
                          variant="ghost"
                          size="sm"
                          asChild
                          className={cn(
                            "w-full justify-start px-3 py-2 h-auto transition-all duration-200 hover:bg-accent/70",
                            isActive(child.href) && "bg-accent text-accent-foreground"
                          )}
                          onMouseEnter={() => setHoveredItem(child.title)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <Link to={child.href}>
                            {renderNavigationItem(child)}
                          </Link>
                        </Button>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            if (item.disabled) {
              return (
                <div key={item.title} className="px-3 py-2">
                  {renderNavigationItem(item)}
                </div>
              );
            }

            return (
              <Button
                key={item.href}
                variant="ghost"
                asChild
                className={cn(
                  "w-full justify-start px-3 py-2 h-auto transition-all duration-200 hover:bg-accent/70",
                  item.href &&
                    isActive(item.href) &&
                    "bg-accent text-accent-foreground",
                  isCollapsed && "justify-center px-2"
                )}
                onMouseEnter={() => setHoveredItem(item.title)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link to={item.href!}>
                  {isCollapsed ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>{renderNavigationItem(item)}</div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    renderNavigationItem(item)
                  )}
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className={cn(
            "flex items-center px-4 py-2 cursor-pointer gap-2 hover:bg-accent hover:text-accent-foreground transition-all duration-200 border-t",
            isCollapsed && "justify-center px-2"
          )}>
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback className="text-xs">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <span className="text-sm truncate">
                {user?.firstName + " " + user?.lastName}
              </span>
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};