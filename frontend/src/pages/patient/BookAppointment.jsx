import React from 'react';
import { CalendarPlus } from 'lucide-react';

const BookAppointment = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Patient Portal / Book Appointment
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Book Appointment</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <CalendarPlus size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Schedule a Consultation</h3>
            <p className="text-slate-400 text-xs">Choose a doctor and timing that fits your schedule</p>
          </div>
        </div>
        
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Use this panel to search for specialist doctors, review slot availability, and request virtual or physical check-ups. Slots will load here in the upcoming booking implementation module.
        </p>
      </div>
    </div>
  );
};

export default BookAppointment;
