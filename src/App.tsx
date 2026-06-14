import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import { LandingPage } from "./pages/LandingPage";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import NotFound from "./pages/NotFound";

import { SupplierAuthProvider } from "@/contexts/SupplierAuthContext";
import { SupplierProtectedRoute } from "@/components/supplier/SupplierProtectedRoute";
import { SupplierLayout } from "@/layouts/SupplierLayout";
import { SupplierAccountLayout } from "@/layouts/SupplierAccountLayout";
import { AcceptInvitePage } from "@/pages/supplier/AcceptInvitePage";
import { SupplierLoginPage } from "@/pages/supplier/SupplierLoginPage";
import { SupplierRegisterPage } from "@/pages/supplier/SupplierRegisterPage";
import { SupplierForgotPasswordPage } from "@/pages/supplier/SupplierForgotPasswordPage";
import { SupplierResetPasswordPage } from "@/pages/supplier/SupplierResetPasswordPage";
import { SupplierAccountDashboard } from "@/pages/supplier-account/SupplierAccountDashboard";
import { SupplierBillsPage } from "@/pages/supplier/SupplierBillsPage";
import { SupplierInvoicesPage } from "@/pages/supplier/SupplierInvoicesPage";
import { SupplierActivityPage } from "@/pages/supplier/SupplierActivityPage";
import { SupplierProfilePage } from "@/pages/supplier-account/SupplierProfilePage";
import ShopDirectoryPage from "@/pages/supplier-account/ShopDirectoryPage";
import SupplierPendingConnectionsPage from "@/pages/supplier-account/SupplierPendingConnectionsPage";
import { MyShopsPage } from "@/pages/supplier-account/MyShopsPage";
import { ShopConnectionDetailPage } from "@/pages/supplier-account/ShopConnectionDetailPage";
import { ConnectionDetailPage } from "@/pages/ConnectionDetailPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SupplierAuthProvider>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/:tab"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/directory"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/connections/pending"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/suppliers/:id"
              element={
                <ProtectedRoute>
                  <ConnectionDetailPage />
                </ProtectedRoute>
              }
            />
            {/* SUPPLIER PORTAL ROUTES */}
            <Route path="/supplier/accept-invite" element={<AcceptInvitePage />} />
            <Route path="/supplier/login" element={<SupplierLoginPage />} />
            <Route path="/supplier/register" element={<SupplierRegisterPage />} />
            <Route path="/supplier/forgot-password" element={<SupplierForgotPasswordPage />} />
            <Route path="/supplier/reset-password" element={<SupplierResetPasswordPage />} />
            
            <Route path="/supplier" element={<SupplierProtectedRoute><SupplierAccountLayout /></SupplierProtectedRoute>}>
              <Route path="dashboard" element={<SupplierAccountDashboard />} />
              <Route path="bills" element={<SupplierBillsPage />} />
              <Route path="invoices" element={<SupplierInvoicesPage />} />
              <Route path="activity" element={<SupplierActivityPage />} />
              <Route path="directory" element={<ShopDirectoryPage />} />
              <Route path="connections/pending" element={<SupplierPendingConnectionsPage />} />
              <Route path="shops" element={<MyShopsPage />} />
              <Route path="shops/:id" element={<ShopConnectionDetailPage />} />
              <Route path="profile" element={<SupplierProfilePage />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SupplierAuthProvider>
      </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
