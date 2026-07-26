import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import PatientDashboard from '../pages/patient/Dashboard';
import DoctorDashboard from '../pages/doctor/Dashboard';
import Loader from '../components/common/Loader';
import { ROLES } from '../utils/constants';

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === ROLES.DOCTOR) {
    return <Navigate to="/doctor/dashboard" replace />;
  }

  return <Navigate to="/patient/dashboard" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (user) {
    if (user.role === ROLES.DOCTOR) {
      return <Navigate to="/doctor/dashboard" replace />;
    }
    return <Navigate to="/patient/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      <Route
        path="/patient/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
