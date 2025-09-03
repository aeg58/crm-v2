import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/auth';
import { socketManager } from './lib/socket';
import { apiClient } from './lib/api';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import MessagesPage from './pages/MessagesPage';
import LeadsPage from './pages/LeadsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated, user, setLoading, setUser } = useAuthStore();

  useEffect(() => {
    // Initialize socket connection if authenticated
    if (isAuthenticated && user) {
      socketManager.connect();
    } else {
      socketManager.disconnect();
    }

    return () => {
      socketManager.disconnect();
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem('accessToken');
    if (token && !isAuthenticated) {
      setLoading(true);
      // Try to get profile to validate token
      apiClient.getProfile()
        .then((response) => {
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            apiClient.setToken(null);
          }
        })
        .catch(() => {
          apiClient.setToken(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } 
      />
      <Route 
        path="/register" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
        } 
      />

      {/* Protected routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="leads" element={<LeadsPage />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
