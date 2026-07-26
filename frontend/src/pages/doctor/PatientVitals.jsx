import React from 'react';
import { Activity } from 'lucide-react';

const PatientVitals = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Doctor Portal / Patient Vitals
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Patient Vitals</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Activity size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Monitor Patient Vitals</h3>
            <p className="text-slate-400 text-xs">Review telemetry, blood pressure trends, and history graphs</p>
          </div>
        </div>
        
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Historical records and telemetry trends for patient vital logs will be monitored in this screen. Dynamic plots illustrating temperature, SpO2, and cardiac metrics will activate in future module additions.
        </p>
      </div>
    </div>
  );
};

export default PatientVitals;
