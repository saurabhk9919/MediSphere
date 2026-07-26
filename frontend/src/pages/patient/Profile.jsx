import React from 'react';
import { User } from 'lucide-react';

const Profile = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Patient Portal / Profile
        </div>
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <User size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Manage Your Personal Information</h3>
            <p className="text-slate-400 text-xs">Keep your health profile updated</p>
          </div>
        </div>
        
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Here you will be able to view and modify your contact details, demographic info, and health insurance settings in future modules.
        </p>
      </div>
    </div>
  );
};

export default Profile;
