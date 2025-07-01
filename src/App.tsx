
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import Index from "./pages/Index";
import ListingsPage from "./pages/ListingsPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import ListPropertyPage from "./pages/ListPropertyPage";
import AuthPage from "./pages/AuthPage";
import MyPropertiesPage from "./pages/MyPropertiesPage";
import EditPropertyPage from "./pages/EditPropertyPage";
import ProfilePage from "./pages/ProfilePage";
import OwnerProfilePage from "./pages/OwnerProfilePage";
import AdminPanel from "./pages/AdminPanel";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/listings" element={<ListingsPage />} />
            <Route path="/property/:id" element={<PropertyDetailPage />} />
            <Route path="/owner/:id" element={<OwnerProfilePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/list-property" element={
              <ProtectedRoute>
                <ListPropertyPage />
              </ProtectedRoute>
            } />
            <Route path="/my-properties" element={
              <ProtectedRoute>
                <MyPropertiesPage />
              </ProtectedRoute>
            } />
            <Route path="/edit-property/:id" element={
              <ProtectedRoute>
                <EditPropertyPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
