import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/Topbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SecurityAuditPanel } from "./components/SecurityAuditPanel";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Unauthorized } from "./pages/Unauthorized";
import { PromotionDashboard } from "./pages/promotions/PromotionDashboard";
import { CreatePromotion } from "./pages/promotions/CreatePromotion";
import { ViewPromotions } from "./pages/promotions/ViewPromotions";
import { MerchandiseDashboard } from "./pages/merchandise/MerchandiseDashboard";
import { AddMerchandise } from "./pages/merchandise/AddMerchandise";
import { ViewMerchandise } from "./pages/merchandise/ViewMerchandise";
import { UserManagement } from "./pages/users/UserManagement";
import { InviteUser } from "./pages/invitations/InviteUser";
import { InviteAdmin } from "./pages/admin/InviteAdmin";
import { OrganizationManagement } from "./pages/organizations/OrganizationManagement";
import { FeatureManagement } from "./pages/features/FeatureManagement";
import { PartnerManagement } from "./pages/partners/PartnerManagement";
import { Profile } from "./pages/profile/Profile";
import { Settings } from "./pages/settings/Settings";
import { Notifications } from "./pages/notifications/Notifications";
import { Toaster } from "./components/ui/sonner";

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/accept-invitation/:token"
            element={<div>Accept Invitation Page</div>}
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <Routes>
            <Route path="/login" element={<Navigate to="/" />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Profile & Settings */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            {/* Feature Management Routes - SYSTEM Level */}
            <Route
              path="/features"
              element={
                <ProtectedRoute 
                  requireAnyRole={["SUPERADMIN"]}
                  featureLevel="SYSTEM"
                  requiredPermission={{ feature: "system_management", action: "manage" }}
                >
                  <FeatureManagement />
                </ProtectedRoute>
              }
            />

            {/* Partner Management - ORGANIZATION Level */}
            <Route
              path="/partners"
              element={
                <ProtectedRoute
                  requireAnyRole={["ORGADMIN", "ADMIN", "SUPERADMIN"]}
                  featureLevel="ORGANIZATION"
                  requiredPermission={{ feature: "partner_management", action: "read" }}
                >
                  <PartnerManagement />
                </ProtectedRoute>
              }
            />

            {/* Promotion Routes - ORGANIZATION Level */}
            <Route
              path="/promotions"
              element={
                <ProtectedRoute
                  featureLevel="ORGANIZATION"
                  requiredPermission={{ feature: "promotion", action: "read" }}
                >
                  <PromotionDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/promotions/view"
              element={
                <ProtectedRoute
                  featureLevel="ORGANIZATION"
                  requiredPermission={{ feature: "promotion", action: "read" }}
                >
                  <ViewPromotions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/promotions/create"
              element={
                <ProtectedRoute
                  featureLevel="ORGANIZATION"
                  requiredPermission={{ feature: "promotion", action: "write" }}
                >
                  <CreatePromotion />
                </ProtectedRoute>
              }
            />

            {/* Merchandise Routes - ORGANIZATION Level */}
            <Route
              path="/merchandise"
              element={
                <ProtectedRoute
                  featureLevel="ORGANIZATION"
                  requiredPermission={{
                    feature: "merchandise",
                    action: "read",
                  }}
                >
                  <MerchandiseDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/merchandise/view"
              element={
                <ProtectedRoute
                  featureLevel="ORGANIZATION"
                  requiredPermission={{
                    feature: "merchandise",
                    action: "read",
                  }}
                >
                  <ViewMerchandise />
                </ProtectedRoute>
              }
            />

            <Route
              path="/merchandise/add"
              element={
                <ProtectedRoute
                  featureLevel="ORGANIZATION"
                  requiredPermission={{
                    feature: "merchandise",
                    action: "write",
                  }}
                >
                  <AddMerchandise />
                </ProtectedRoute>
              }
            />

            {/* User Management Routes - ORGANIZATION Level */}
            <Route
              path="/users"
              element={
                <ProtectedRoute
                  featureLevel="ORGANIZATION"
                  requiredPermission={{
                    feature: "user_management",
                    action: "read",
                  }}
                  requireAnyRole={["ORGADMIN", "ADMIN", "SUPERADMIN"]}
                >
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users/invite"
              element={
                <ProtectedRoute
                  featureLevel="ORGANIZATION"
                  requiredPermission={{
                    feature: "user_management",
                    action: "write",
                  }}
                  requireAnyRole={["ORGADMIN", "ADMIN", "SUPERADMIN"]}
                >
                  <InviteUser />
                </ProtectedRoute>
              }
            />

            {/* Admin Invitation Routes - SYSTEM Level */}
            <Route
              path="/admin/invite"
              element={
                <ProtectedRoute 
                  requireAnyRole={["SUPERADMIN"]}
                  featureLevel="SYSTEM"
                  requiredPermission={{ feature: "system_management", action: "manage" }}
                >
                  <InviteAdmin />
                </ProtectedRoute>
              }
            />

            {/* Organization Routes - USER_ROLE Level */}
            <Route
              path="/organizations"
              element={
                <ProtectedRoute 
                  requireAnyRole={["ADMIN", "SUPERADMIN"]}
                  featureLevel="USER_ROLE"
                  requiredPermission={{ feature: "organization_management", action: "read" }}
                >
                  <OrganizationManagement />
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard if authenticated, otherwise to login */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
      
      {/* Security Audit Panel - Only visible to SUPERADMIN and ADMIN */}
      <SecurityAuditPanel />
      
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;