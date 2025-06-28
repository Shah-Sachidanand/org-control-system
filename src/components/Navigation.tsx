import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import {
  User,
  LogOut,
  Settings,
  Users,
  Gift,
  Megaphone,
  ShieldCheck,
  UserPlus,
  Eye,
  Plus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export const Navigation: React.FC = () => {
  const { user, logout, hasPermission, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/",
      show: true,
    },
    {
      title: "Promotions",
      href: "/promotions",
      show: hasPermission("promotion", "read"),
      children: [
        {
          title: "Dashboard",
          href: "/promotions",
          show: hasPermission("promotion", "read"),
          icon: Megaphone,
        },
        {
          title: "View All",
          href: "/promotions/view",
          show: hasPermission("promotion", "read"),
          icon: Eye,
        },
        {
          title: "Create New",
          href: "/promotions/create",
          show: hasPermission("promotion", "write"),
          icon: Plus,
        },
      ],
    },
    {
      title: "Merchandise",
      href: "/merchandise",
      show: hasPermission("merchandise", "read"),
      children: [
        {
          title: "Dashboard",
          href: "/merchandise",
          show: hasPermission("merchandise", "read"),
          icon: Gift,
        },
        {
          title: "View All",
          href: "/merchandise/view",
          show: hasPermission("merchandise", "read"),
          icon: Eye,
        },
        {
          title: "Add New",
          href: "/merchandise/add",
          show: hasPermission("merchandise", "write"),
          icon: Plus,
        },
      ],
    },
    {
      title: "Users",
      href: "/users",
      show:
        hasPermission("user_management", "read") ||
        ["ORGADMIN", "ADMIN", "SUPERADMIN"].includes(user.role),
      children: [
        {
          title: "Manage Users",
          href: "/users",
          show: hasPermission("user_management", "read"),
          icon: Users,
        },
        {
          title: "Invite User",
          href: "/users/invite",
          show: hasPermission("user_management", "write"),
          icon: UserPlus,
        },
      ],
    },
    {
      title: "Organizations",
      href: "/organizations",
      show: hasRole("ADMIN") || hasRole("SUPERADMIN"),
    },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <ShieldCheck className="h-6 w-6" />
              <span className="font-bold text-lg">OrgControl</span>
            </Link>

            <NavigationMenu>
              <NavigationMenuList>
                {navigationItems.map(
                  (item) =>
                    item.show && (
                      <NavigationMenuItem key={item.href}>
                        {item.children ? (
                          <>
                            <NavigationMenuTrigger>
                              <Link
                                to={`${item.href}`}
                                className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                              >
                                {item.title}
                              </Link>
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                              <div className="grid w-[300px] gap-3 p-4">
                                {item.children.map(
                                  (child) =>
                                    child.show && (
                                      <NavigationMenuLink
                                        key={child.href}
                                        asChild
                                      >
                                        <Link
                                          to={child.href}
                                          className="flex items-center space-x-3 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                        >
                                          {child.icon && (
                                            <child.icon className="h-4 w-4" />
                                          )}
                                          <div>
                                            <div className="text-sm font-medium leading-none">
                                              {child.title}
                                            </div>
                                          </div>
                                        </Link>
                                      </NavigationMenuLink>
                                    )
                                )}
                              </div>
                            </NavigationMenuContent>
                          </>
                        ) : (
                          <Link
                            to={item.href}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                              location.pathname === item.href
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {item.title}
                          </Link>
                        )}
                      </NavigationMenuItem>
                    )
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user.role} {user.organization && `• ${user.organization.name}`}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>S</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
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
        </div>
      </div>
    </nav>
  );
};
