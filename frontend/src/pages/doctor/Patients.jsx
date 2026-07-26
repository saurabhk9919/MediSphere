import React from 'react';
import { Users } from 'lucide-react';

const Patients = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Doctor Portal / Patients
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Patients</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Patient Registry</h3>
            <p className="text-slate-400 text-xs">Review clinical files and treatment progress</p>
          </div>
        </div>
        
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          A list of all patients assigned under your care will render here. You will be able to review active diagnostic reports, contact details, and vital trends for each patient.
        </p>
      </div>
    </div>
  );
};

export default Patients;
