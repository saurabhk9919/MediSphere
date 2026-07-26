import React from 'react';
import { FileText } from 'lucide-react';

const Prescriptions = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Patient Portal / Prescriptions
        </div>
        <h1 className="text-2xl font-bold text-slate-800">My Prescriptions</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <FileText size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Your Prescribed Medications</h3>
            <p className="text-slate-400 text-xs">Read active instructions, dosage, and diagnostic details</p>
          </div>
        </div>
        
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Medications, dosages, and notes issued by your doctors will populate here. You can download pdf records of your prescriptions in subsequent module integrations.
        </p>
      </div>
    </div>
  );
};

export default Prescriptions;
