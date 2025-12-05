
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { HelmetProvider } from 'react-helmet-async';
import InstallPrompt from './components/pwa/InstallPrompt';
import { LocationProvider } from './contexts/LocationContext';

// Lazy load non-critical routes to improve initial load time
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ListingsPage = lazy(() => import('./pages/ListingsPage'));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage'));
const OwnerProfilePage = lazy(() => import('./pages/OwnerProfilePage'));
const ListPropertyPage = lazy(() => import('./pages/ListPropertyPage'));
const EditPropertyPage = lazy(() => import('./pages/EditPropertyPage'));
const MyPropertiesPage = lazy(() => import('./pages/MyPropertiesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const UsersManagement = lazy(() => import('./pages/admin/UsersManagement'));
const PropertiesManagement = lazy(() => import('./pages/admin/PropertiesManagement'));
const TenantsManagement = lazy(() => import('./pages/admin/TenantsManagement'));
const PaymentsManagement = lazy(() => import('./pages/admin/PaymentsManagement'));
const ReviewsManagement = lazy(() => import('./pages/admin/ReviewsManagement'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const TenantsPage = lazy(() => import('./pages/TenantsPage'));
const PaymentDashboardPage = lazy(() => import('./pages/PaymentDashboardPage'));
const InstallPage = lazy(() => import('./pages/InstallPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <LocationProvider>
              <div className="App">
                <InstallPrompt />
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tuleeto-orange"></div>
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/listings" element={<ListingsPage />} />
                    <Route path="/property/:id" element={<PropertyDetailPage />} />
                    <Route path="/owner/:ownerId" element={<OwnerProfilePage />} />
                    <Route path="/list-property" element={
                      <ProtectedRoute>
                        <ListPropertyPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/edit-property/:id" element={
                      <ProtectedRoute>
                        <EditPropertyPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/my-properties" element={
                      <ProtectedRoute>
                        <MyPropertiesPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/properties/:propertyId/tenants" element={
                      <ProtectedRoute>
                        <TenantsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/properties/:propertyId/payments" element={
                      <ProtectedRoute>
                        <PaymentDashboardPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/properties/:propertyId/payments/:tenantId" element={
                      <ProtectedRoute>
                        <PaymentDashboardPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    } />
                    <Route path="/wishlist" element={
                      <ProtectedRoute>
                        <WishlistPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/*" element={
                      <AdminRoute>
                        <SidebarProvider>
                          <div className="flex min-h-screen w-full">
                            <AdminSidebar />
                            <main className="flex-1 p-8 bg-background">
                              <Routes>
                                <Route index element={<Dashboard />} />
                                <Route path="users" element={<UsersManagement />} />
                                <Route path="properties" element={<PropertiesManagement />} />
                                <Route path="tenants" element={<TenantsManagement />} />
                                <Route path="payments" element={<PaymentsManagement />} />
                                <Route path="reviews" element={<ReviewsManagement />} />
                                <Route path="settings" element={<Settings />} />
                                <Route path="logs" element={<AuditLogs />} />
                                <Route path="*" element={<Dashboard />} />
                              </Routes>
                            </main>
                          </div>
                        </SidebarProvider>
                      </AdminRoute>
                    } />
                    <Route path="/terms" element={<TermsOfServicePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/install" element={<InstallPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <Toaster />
              </div>
            </LocationProvider>
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
