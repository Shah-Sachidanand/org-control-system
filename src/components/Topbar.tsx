import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Badge } from "./ui/badge";
import { ThemeToggle } from "./ui/theme-toggle";
import { 
  User, 
  LogOut, 
  Settings, 
  Bell, 
  Search, 
  Command as CommandIcon,
  Home,
  Users,
  Gift,
  Megaphone,
  Building,
  Handshake,
  Layers,
  ChevronDown,
  Activity,
  HelpCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "../lib/utils";

export const TopBar: React.FC = () => {
  const { user, logout, hasPermission, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState(3); // Mock notification count

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Mock search results based on user permissions
  const getSearchResults = () => {
    const results = [];
    
    if (hasPermission("promotion", "read")) {
      results.push({
        title: "Promotions",
        description: "Manage promotional campaigns",
        icon: Megaphone,
        href: "/promotions",
        category: "Features"
      });
    }
    
    if (hasPermission("merchandise", "read")) {
      results.push({
        title: "Merchandise",
        description: "Manage inventory and rewards",
        icon: Gift,
        href: "/merchandise",
        category: "Features"
      });
    }
    
    if (hasRole("ORGADMIN") || hasRole("ADMIN") || hasRole("SUPERADMIN")) {
      results.push({
        title: "Users",
        description: "Manage team members",
        icon: Users,
        href: "/users",
        category: "Management"
      });
    }
    
    if (hasRole("ADMIN") || hasRole("SUPERADMIN")) {
      results.push({
        title: "Organizations",
        description: "Manage organizations",
        icon: Building,
        href: "/organizations",
        category: "Management"
      });
    }
    
    if (hasRole("SUPERADMIN")) {
      results.push({
        title: "Features",
        description: "System feature management",
        icon: Layers,
        href: "/features",
        category: "System"
      });
    }

    results.push(
      {
        title: "Dashboard",
        description: "Overview and analytics",
        icon: Home,
        href: "/",
        category: "Navigation"
      },
      {
        title: "Profile",
        description: "Manage your account",
        icon: User,
        href: "/profile",
        category: "Account"
      },
      {
        title: "Settings",
        description: "Application preferences",
        icon: Settings,
        href: "/settings",
        category: "Account"
      }
    );

    return results.filter(result => 
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/promotions')) return 'Promotions';
    if (path.startsWith('/merchandise')) return 'Merchandise';
    if (path.startsWith('/users')) return 'Users';
    if (path.startsWith('/organizations')) return 'Organizations';
    if (path.startsWith('/partners')) return 'Partners';
    if (path.startsWith('/features')) return 'Features';
    if (path.startsWith('/profile')) return 'Profile';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/notifications')) return 'Notifications';
    return 'Dashboard';
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 sticky top-0 z-50">
      {/* Left Section - Breadcrumb */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Home className="h-4 w-4" />
          <span>/</span>
          <span className="font-medium text-foreground">{getBreadcrumb()}</span>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex items-center space-x-4 flex-1 max-w-md mx-4">
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "relative w-full justify-start text-sm text-muted-foreground",
                "hover:bg-accent hover:text-accent-foreground transition-colors"
              )}
            >
              <Search className="mr-2 h-4 w-4" />
              <span>Search...</span>
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="center">
            <Command>
              <CommandInput 
                placeholder="Search features, pages, and more..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                {Object.entries(
                  getSearchResults().reduce((acc, result) => {
                    if (!acc[result.category]) acc[result.category] = [];
                    acc[result.category].push(result);
                    return acc;
                  }, {} as Record<string, typeof getSearchResults>)
                ).map(([category, items]) => (
                  <CommandGroup key={category} heading={category}>
                    {items.map((result) => (
                      <CommandItem
                        key={result.href}
                        onSelect={() => {
                          navigate(result.href);
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <result.icon className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {result.description}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center space-x-4">
        {/* Activity Indicator */}
        <Button variant="ghost" size="sm" className="relative">
          <Activity className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
        </Button>

        {/* Help */}
        <Button variant="ghost" size="sm">
          <HelpCircle className="h-4 w-4" />
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Button
          onClick={() => navigate("/notifications")}
          variant="ghost"
          size="sm"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {notifications > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {notifications}
            </Badge>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </Button>
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
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {user?.role}
                  </Badge>
                  {user?.organization && (
                    <Badge variant="secondary" className="text-xs">
                      {user.organization.name}
                    </Badge>
                  )}
                </div>
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
            <DropdownMenuItem onClick={() => navigate("/notifications")}>
              <Bell className="mr-2 h-4 w-4" />
              Notifications
              {notifications > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {notifications}
                </Badge>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};