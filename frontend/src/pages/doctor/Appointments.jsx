import React from 'react';
import { Calendar } from 'lucide-react';

const Appointments = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Doctor Portal / Appointments
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Calendar size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Appointment Management</h3>
            <p className="text-slate-400 text-xs">Review scheduled sessions, accept requests, or change status</p>
          </div>
        </div>
        
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Consultation bookings requested by patients will load in this interface. You can approve or decline timings, mark sessions as finished, and open direct video checkups.
        </p>
      </div>
    </div>
  );
};

export default Appointments;
