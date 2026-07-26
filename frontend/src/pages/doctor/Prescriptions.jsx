import React from 'react';
import { FileText } from 'lucide-react';

const Prescriptions = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Doctor Portal / Prescriptions
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Prescriptions</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <FileText size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Issue Prescriptions</h3>
            <p className="text-slate-400 text-xs">Write dosage lists and assign medications to checked patients</p>
          </div>
        </div>
        
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Use this panel to issue pharmaceutical items, intake instructions, and clinical advice. You will be able to search patients and submit medical cards to database in future module builds.
        </p>
      </div>
    </div>
  );
};

export default Prescriptions;
