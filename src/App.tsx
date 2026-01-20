import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';

import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { NewServiceRequest } from './pages/customer/NewServiceRequest';
import { MyRequests } from './pages/customer/MyRequests';
import { MyVehicles } from './pages/customer/MyVehicles';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ServiceRequests } from './pages/admin/ServiceRequests';
import { Mechanics } from './pages/admin/Mechanics';
import { Customers } from './pages/admin/Customers';
import { Vehicles } from './pages/admin/Vehicles';

import { MechanicDashboard } from './pages/mechanic/MechanicDashboard';
import { ServiceQueue } from './pages/mechanic/ServiceQueue';
import { CompletedJobs } from './pages/mechanic/CompletedJobs';

function RootRedirect() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role === 'admin') {
    return <Navigate to="/admin" replace />;
  } else if (profile.role === 'mechanic') {
    return <Navigate to="/mechanic" replace />;
  } else {
    return <Navigate to="/customer" replace />;
  }
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/customer"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CustomerDashboard />} />
              <Route path="new-request" element={<NewServiceRequest />} />
              <Route path="my-requests" element={<MyRequests />} />
              <Route path="vehicles" element={<MyVehicles />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="service-requests" element={<ServiceRequests />} />
              <Route path="mechanics" element={<Mechanics />} />
              <Route path="customers" element={<Customers />} />
              <Route path="vehicles" element={<Vehicles />} />
            </Route>

            <Route
              path="/mechanic"
              element={
                <ProtectedRoute allowedRoles={['mechanic']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MechanicDashboard />} />
              <Route path="queue" element={<ServiceQueue />} />
              <Route path="completed" element={<CompletedJobs />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
