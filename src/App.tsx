import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Navigation } from "./components/Navigation";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import { OrganizationManagement } from "./pages/organizations/OrganizationManagement";
import { Toaster } from "./components/ui/sonner";

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {user && <Navigation />}
      <main className={user ? "" : ""}>
        <Routes>
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/" />}
          />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Promotion Routes */}
          <Route
            path="/promotions"
            element={
              <ProtectedRoute
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
                requiredPermission={{ feature: "promotion", action: "write" }}
              >
                <CreatePromotion />
              </ProtectedRoute>
            }
          />

          {/* Merchandise Routes */}
          <Route
            path="/merchandise"
            element={
              <ProtectedRoute
                requiredPermission={{ feature: "merchandise", action: "read" }}
              >
                <MerchandiseDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/merchandise/view"
            element={
              <ProtectedRoute
                requiredPermission={{ feature: "merchandise", action: "read" }}
              >
                <ViewMerchandise />
              </ProtectedRoute>
            }
          />

          <Route
            path="/merchandise/add"
            element={
              <ProtectedRoute
                requiredPermission={{ feature: "merchandise", action: "write" }}
              >
                <AddMerchandise />
              </ProtectedRoute>
            }
          />

          {/* User Management Routes */}
          <Route
            path="/users"
            element={
              <ProtectedRoute
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

          {/* Organization Routes */}
          <Route
            path="/organizations"
            element={
              <ProtectedRoute requireAnyRole={["ADMIN", "SUPERADMIN"]}>
                <OrganizationManagement />
              </ProtectedRoute>
            }
          />

          {/* Redirect root to dashboard if authenticated, otherwise to login */}
          <Route
            path="*"
            element={user ? <Navigate to="/" /> : <Navigate to="/login" />}
          />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
