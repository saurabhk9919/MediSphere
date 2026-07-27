import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

import PatientDashboard from '../pages/patient/Dashboard';
import PatientProfile from '../pages/patient/Profile';
import BookAppointment from '../pages/patient/BookAppointment';
import PatientAppointments from '../pages/patient/Appointments';
import PatientPrescriptions from '../pages/patient/Prescriptions';
import PatientVitals from '../pages/patient/Vitals';

import DoctorDashboard from '../pages/doctor/Dashboard';
import DoctorPatients from '../pages/doctor/Patients';
import DoctorAppointments from '../pages/doctor/Appointments';
import DoctorPrescriptions from '../pages/doctor/Prescriptions';
import DoctorPatientVitals from '../pages/doctor/PatientVitals';

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
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="profile" element={<PatientProfile />} />
        <Route path="book-appointment" element={<BookAppointment />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="prescriptions" element={<PatientPrescriptions />} />
        <Route path="vitals" element={<PatientVitals />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="patients" element={<DoctorPatients />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="prescriptions" element={<DoctorPrescriptions />} />
        <Route path="patient-vitals" element={<DoctorPatientVitals />} />
        <Route path="patients/:patientId/vitals" element={<DoctorPatientVitals />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
