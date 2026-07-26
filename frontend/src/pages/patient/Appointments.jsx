import React from 'react';
import { Calendar } from 'lucide-react';

const Appointments = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Patient Portal / Appointments
        </div>
        <h1 className="text-2xl font-bold text-slate-800">My Appointments</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Calendar size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Track and Manage Consultations</h3>
            <p className="text-slate-400 text-xs">View active bookings, history, and status updates</p>
          </div>
        </div>
        
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          A list of your upcoming, completed, and canceled sessions will be shown here. You will also be able to join telemedicine calls or request reschedules directly from this screen.
        </p>
      </div>
    </div>
  );
};

export default Appointments;
