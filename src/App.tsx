
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="App">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tuleeto-orange"></div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
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
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                } />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Toaster />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
