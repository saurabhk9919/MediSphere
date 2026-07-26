import React from 'react';
import { Activity } from 'lucide-react';

const Vitals = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Patient Portal / Vitals
        </div>
        <h1 className="text-2xl font-bold text-slate-800">My Vitals</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Activity size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Vital Signs Tracking</h3>
            <p className="text-slate-400 text-xs">Track blood pressure, heart rate, temperature, and SpO2</p>
          </div>
        </div>
        
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Historical records of your physical parameters will render here using dynamic charts. You can review your vitals trends and log fresh values in the vitals module.
        </p>
      </div>
    </div>
  );
};

export default Vitals;
