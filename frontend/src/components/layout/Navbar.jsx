import React from 'react';
import useAuth from '../../hooks/useAuth';
import { Bell, LogOut, Menu, X, Activity } from 'lucide-react';

const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs h-16 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="text-slate-600 hover:text-blue-600 p-2 rounded-lg hover:bg-slate-100 lg:hidden cursor-pointer"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <Activity size={20} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800">
            MediSphere
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-slate-500 hover:text-blue-600 p-2 rounded-lg hover:bg-slate-100 transition duration-150 cursor-pointer">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
        </button>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-800">{user?.fullName}</span>
            <span className="text-xs font-medium text-slate-500 capitalize px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 mt-0.5">
              {user?.role}
            </span>
          </div>

          <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200 shadow-inner select-none">
            {getInitials(user?.fullName)}
          </div>

          <button
            onClick={logout}
            className="text-slate-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition duration-150 cursor-pointer"
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
