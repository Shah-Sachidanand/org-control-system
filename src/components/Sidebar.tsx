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
  Zap,
  TrendingUp,
  Activity,
  Sparkles,
  Flame,
  Star,
  Crown,
  Rocket,
  Bell,
  Search,
  Filter,
  MoreHorizontal
} from "lucide-react";
import { cn } from "../lib/utils";

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
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

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
    isNew?: boolean;
    isPopular?: boolean;
    isHot?: boolean;
    description?: string;
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
    isNew?: boolean;
    isPopular?: boolean;
    isHot?: boolean;
    description?: string;
    gradient?: string;
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
      isPopular: true,
      description: "Overview and analytics",
      gradient: "from-blue-500 to-purple-600",
    },
    {
      title: "Organizations",
      href: "/organizations",
      icon: Building,
      show: hasFeatureAccess("organization_management", "USER_ROLE"),
      badge: hasRole("SUPERADMIN") ? "All" : "Mine",
      description: "Manage organizations",
      gradient: "from-green-500 to-teal-600",
    },
    {
      title: "Features",
      href: "/features",
      icon: Layers,
      show: hasFeatureAccess("system_management", "SYSTEM"),
      badge: "System",
      description: "System configuration",
      gradient: "from-purple-500 to-pink-600",
    },
    {
      title: "Partners",
      href: "/partners",
      icon: Handshake,
      show: hasFeatureAccess("partner_management", "ORGANIZATION"),
      badge: "Sponsors",
      isNew: true,
      description: "Manage partnerships",
      gradient: "from-orange-500 to-red-600",
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
      isPopular: true,
      isHot: true,
      description: "Marketing campaigns",
      gradient: "from-pink-500 to-rose-600",
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
          description: "Campaign overview",
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
          description: "Browse campaigns",
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
          isNew: true,
          isHot: true,
          description: "New campaign",
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
      description: "Inventory management",
      gradient: "from-emerald-500 to-green-600",
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
          description: "Inventory overview",
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
          description: "Browse items",
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
          description: "New merchandise",
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
      description: "Team management",
      gradient: "from-indigo-500 to-blue-600",
      children: [
        {
          title: "Manage Users",
          href: "/users",
          icon: Users,
          show:
            hasFeatureAccess("user_management", "ORGANIZATION") ||
            hasFeatureAccess("organization_management", "USER_ROLE"),
          description: "User administration",
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
          description: "Send invitations",
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
          description: "Platform admins",
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

  const renderNavigationItem = (item: NavigationItem | NavigationChild, isChild = false) => {
    const isItemActive = item.href ? isActive(item.href) : false;
    const isHovered = hoveredItem === item.title;

    const content = (
      <div className={cn(
        "flex items-center space-x-3 transition-all duration-300 ease-out relative",
        isCollapsed && !isChild && "justify-center",
        isItemActive && "scale-[1.02]",
        isHovered && !item.disabled && "scale-105"
      )}>
        {/* Icon with enhanced styling */}
        <div className={cn(
          "relative transition-all duration-300 ease-out",
          isItemActive && "animate-pulse",
          isHovered && !item.disabled && "rotate-3 scale-110"
        )}>
          <div className={cn(
            "p-2 rounded-lg transition-all duration-300",
            isItemActive 
              ? "bg-primary/20 shadow-lg shadow-primary/25" 
              : isHovered && !item.disabled
              ? "bg-accent/50 shadow-md"
              : "bg-transparent"
          )}>
            <item.icon className={cn(
              "h-4 w-4 transition-all duration-300",
              isItemActive ? "text-primary" : "text-muted-foreground",
              isHovered && !item.disabled && "text-primary"
            )} />
          </div>
          
          {/* Status indicators */}
          {item.isNew && !isCollapsed && (
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />
            </div>
          )}
          {item.isHot && !isCollapsed && (
            <div className="absolute -top-1 -right-1">
              <Flame className="h-3 w-3 text-red-500 animate-bounce" />
            </div>
          )}
        </div>

        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-medium transition-all duration-300 truncate",
                  isItemActive ? "text-primary font-semibold" : "text-foreground",
                  isHovered && !item.disabled && "text-primary"
                )}>
                  {item.title}
                </span>
                
                {/* Enhanced badges */}
                {item.badge && (
                  <Badge 
                    variant={isItemActive ? "default" : "secondary"} 
                    className={cn(
                      "text-xs transition-all duration-300 animate-in fade-in-0",
                      isHovered && "scale-110"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              
              {/* Description for expanded state */}
              {item.description && !isChild && (
                <p className={cn(
                  "text-xs text-muted-foreground transition-all duration-300 truncate",
                  isHovered && "text-primary/70"
                )}>
                  {item.description}
                </p>
              )}
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-1">
              {item.isNew && (
                <Badge 
                  variant="default" 
                  className={cn(
                    "text-xs bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse",
                    isHovered && "scale-110"
                  )}
                >
                  New
                </Badge>
              )}
              {item.isPopular && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs border-orange-200 text-orange-600 bg-orange-50",
                    isHovered && "scale-110 border-orange-300"
                  )}
                >
                  <Star className="h-2 w-2 mr-1 fill-current" />
                  Popular
                </Badge>
              )}
              {item.isHot && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs border-red-200 text-red-600 bg-red-50 animate-pulse",
                    isHovered && "scale-110 border-red-300"
                  )}
                >
                  <Flame className="h-2 w-2 mr-1 fill-current" />
                  Hot
                </Badge>
              )}
              {item.disabled && (
                <Lock className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </>
        )}

        {/* Active indicator */}
        {isItemActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/50 rounded-r-full animate-in slide-in-from-left-1" />
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
      return { 
        status: "Platform Admin", 
        color: "bg-gradient-to-r from-red-500 to-pink-500 text-white",
        icon: Crown
      };
    }

    if (user.role === "ADMIN") {
      return { 
        status: "Platform Admin", 
        color: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white",
        icon: Star
      };
    }

    if (!user.organization) {
      return { 
        status: "No Organization", 
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        icon: AlertTriangle
      };
    }

    const enabledFeatures = user.organization.features?.filter(f => f.isEnabled).length || 0;
    const totalFeatures = user.organization.features?.length || 0;

    return {
      status: `${enabledFeatures}/${totalFeatures} Features`,
      color: enabledFeatures === totalFeatures 
        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
        : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
      icon: enabledFeatures === totalFeatures ? Rocket : Zap
    };
  };

  const orgStatus = getOrganizationStatus();

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out relative",
        isCollapsed ? "w-16" : "w-72",
        className
      )}
    >
      {/* Enhanced Logo & Collapse Toggle */}
      <div className="flex h-16 items-center border-b px-6 relative bg-gradient-to-r from-primary/5 to-primary/10">
        <Link to="/" className={cn(
          "flex items-center space-x-3 transition-all duration-300 hover:scale-105",
          isCollapsed && "justify-center w-full"
        )}>
          <div className="relative">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <Activity className="absolute -top-1 -right-1 h-3 w-3 text-green-500 animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                OrgControl
              </span>
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
            "absolute -right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full border bg-background hover:bg-accent transition-all duration-300",
            "shadow-lg hover:shadow-xl hover:scale-110"
          )}
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform duration-300",
            isCollapsed && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Enhanced User Info */}
      <div className={cn(
        "border-b p-4 transition-all duration-300",
        isCollapsed ? "px-2" : "px-4"
      )}>
        <div className={cn(
          "flex items-center space-x-3 transition-all duration-300",
          isCollapsed && "justify-center"
        )}>
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/20">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {user?.role}
                </Badge>
                {orgStatus && (
                  <Badge className={`text-xs ${orgStatus.color} border-0`}>
                    <orgStatus.icon className="h-3 w-3 mr-1" />
                    {orgStatus.status}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced organization status alert */}
        {!isCollapsed && user && !user.organization && user.role !== "SUPERADMIN" && user.role !== "ADMIN" && (
          <Alert className="mt-3 border-orange-200 bg-orange-50">
            <Info className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-xs text-orange-700">
              No organization assigned. Contact your administrator.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Enhanced Navigation */}
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
                        "w-full justify-between px-3 py-3 h-auto transition-all duration-300 hover:bg-accent/70 group relative overflow-hidden",
                        (isOpen || hasActiveChild) && "bg-accent/50 text-accent-foreground shadow-sm",
                        item.disabled && "opacity-50 cursor-not-allowed",
                        isCollapsed && "justify-center px-2"
                      )}
                      disabled={item.disabled}
                      onMouseEnter={() => setHoveredItem(item.title)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {/* Background gradient effect */}
                      {item.gradient && (isOpen || hasActiveChild) && (
                        <div className={cn(
                          "absolute inset-0 bg-gradient-to-r opacity-10 transition-opacity duration-300",
                          item.gradient
                        )} />
                      )}
                      
                      <div className="relative z-10 flex items-center justify-between w-full">
                        {renderNavigationItem(item)}
                        {!item.disabled && !isCollapsed && (
                          <div className="transition-transform duration-300 group-hover:scale-110">
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pl-6 pt-1 animate-in slide-in-from-top-1">
                    {item.children.map((child) => {
                      if (!child.show || !child.href) return null;

                      if (child.disabled) {
                        return (
                          <div key={child.href} className="px-3 py-2">
                            {renderNavigationItem(child, true)}
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
                            "w-full justify-start px-3 py-3 h-auto transition-all duration-300 hover:bg-accent/70 group relative",
                            isActive(child.href) && "bg-accent/50 text-accent-foreground shadow-sm"
                          )}
                          onMouseEnter={() => setHoveredItem(child.title)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <Link to={child.href} className="w-full">
                            {renderNavigationItem(child, true)}
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
                  "w-full justify-start px-3 py-3 h-auto transition-all duration-300 hover:bg-accent/70 group relative overflow-hidden",
                  item.href &&
                    isActive(item.href) &&
                    "bg-accent/50 text-accent-foreground shadow-sm",
                  isCollapsed && "justify-center px-2"
                )}
                onMouseEnter={() => setHoveredItem(item.title)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link to={item.href!} className="w-full">
                  {/* Background gradient effect */}
                  {item.gradient && item.href && isActive(item.href) && (
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-r opacity-10 transition-opacity duration-300",
                      item.gradient
                    )} />
                  )}
                  
                  <div className="relative z-10 w-full">
                    {isCollapsed ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>{renderNavigationItem(item)}</div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium">{item.title}</p>
                              {item.description && (
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              )}
                              {item.isNew && <p className="text-xs text-blue-400">New Feature!</p>}
                              {item.isPopular && <p className="text-xs text-orange-400">Popular</p>}
                              {item.isHot && <p className="text-xs text-red-400">Hot!</p>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      renderNavigationItem(item)
                    )}
                  </div>
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Enhanced User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className={cn(
            "flex items-center px-4 py-3 cursor-pointer gap-3 hover:bg-accent hover:text-accent-foreground transition-all duration-300 border-t group relative overflow-hidden",
            isCollapsed && "justify-center px-2"
          )}>
            {/* Hover effect background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10 flex items-center gap-3 w-full">
              <Avatar className="h-10 w-10 border-2 border-primary/20 transition-all duration-300 group-hover:border-primary/40 group-hover:scale-105">
                <AvatarImage src="" />
                <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block group-hover:text-primary transition-colors duration-300">
                    {user?.firstName + " " + user?.lastName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground group-hover:text-primary/70 transition-colors duration-300">
                      Online
                    </span>
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              )}
              {!isCollapsed && (
                <MoreHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:scale-110" />
              )}
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <div className="flex items-center justify-start gap-3 p-3 bg-gradient-to-r from-primary/5 to-primary/10">
            <Avatar className="h-12 w-12">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/20 text-primary">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-semibold">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {user?.email}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {user?.role}
                </Badge>
                {orgStatus && (
                  <Badge className={`text-xs ${orgStatus.color} border-0`}>
                    <orgStatus.icon className="h-3 w-3 mr-1" />
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
            <User className="mr-3 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
            <Settings className="mr-3 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/notifications")} className="cursor-pointer">
            <Bell className="mr-3 h-4 w-4" />
            Notifications
            <Badge variant="secondary" className="ml-auto">
              3
            </Badge>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
            <LogOut className="mr-3 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};