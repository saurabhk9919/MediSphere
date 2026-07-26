import React from 'react';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/common/Button';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
      <h1 className="text-3xl font-extrabold mb-2">Patient Dashboard</h1>
      <p className="text-slate-400 mb-6">Welcome back, {user?.fullName}!</p>
      <Button variant="danger" onClick={logout}>Log Out</Button>
    </div>
  );
};

export default PatientDashboard;
