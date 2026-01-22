import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { ProfilePage } from './pages/Profile';

import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { NewServiceRequest } from './pages/customer/NewServiceRequest';
import { MyRequests } from './pages/customer/MyRequests';
import { MyVehicles } from './pages/customer/MyVehicles';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ServiceRequests } from './pages/admin/ServiceRequests';
import { Mechanics } from './pages/admin/Mechanics';
import { Customers } from './pages/admin/Customers';
import { ServiceTypes } from './pages/admin/ServiceTypes';

import { MechanicDashboard } from './pages/mechanic/MechanicDashboard';
import { ServiceQueue } from './pages/mechanic/ServiceQueue';
import { CompletedJobs } from './pages/mechanic/CompletedJobs';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['admin', 'mechanic', 'customer', 'superadmin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ProfilePage />} />
            </Route>

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
              <Route path="service-types" element={<ServiceTypes />} />
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
