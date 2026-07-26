import React from 'react';
import useAuth from '../../hooks/useAuth';
import { Calendar, FileText, Activity } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Patient Portal / Dashboard
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Upcoming Appointments</div>
            <div className="text-xl font-bold text-slate-800">--</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Active Prescriptions</div>
            <div className="text-xl font-bold text-slate-800">--</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Latest Vitals Log</div>
            <div className="text-xl font-bold text-slate-800">--</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Welcome to MediSphere, {user?.fullName}</h3>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          This is your patient portal dashboard. Here you will find quick overviews of your health logs, upcoming appointments, and active prescriptions. Real-time patient information modules will load here in the next update.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
