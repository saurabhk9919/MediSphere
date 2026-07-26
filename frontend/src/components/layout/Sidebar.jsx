import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  CalendarPlus,
  Calendar,
  FileText,
  Activity,
  Users,
  ChevronLeft,
  ChevronRight,
  Activity as LogoIcon
} from 'lucide-react';

const Sidebar = ({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile, role }) => {
  const patientMenuItems = [
    { name: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
    { name: 'Profile', path: '/patient/profile', icon: User },
    { name: 'Book Appointment', path: '/patient/book-appointment', icon: CalendarPlus },
    { name: 'My Appointments', path: '/patient/appointments', icon: Calendar },
    { name: 'My Prescriptions', path: '/patient/prescriptions', icon: FileText },
    { name: 'My Vitals', path: '/patient/vitals', icon: Activity },
  ];

  const doctorMenuItems = [
    { name: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
    { name: 'Patients', path: '/doctor/patients', icon: Users },
    { name: 'Appointments', path: '/doctor/appointments', icon: Calendar },
    { name: 'Prescriptions', path: '/doctor/prescriptions', icon: FileText },
    { name: 'Patient Vitals', path: '/doctor/patient-vitals', icon: Activity },
  ];

  const menuItems = role === 'doctor' ? doctorMenuItems : patientMenuItems;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-600 select-none">
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <LogoIcon size={18} />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <span className="font-extrabold text-lg text-slate-800 tracking-tight">
              MediSphere
            </span>
          )}
        </div>

        {!isMobileOpen && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center h-8 w-8 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition duration-150 cursor-pointer"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => isMobileOpen && onCloseMobile()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
              title={isCollapsed && !isMobileOpen ? item.name : undefined}
            >
              <Icon size={20} className="shrink-0" />
              {(!isCollapsed || isMobileOpen) && (
                <span className="truncate">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity lg:hidden ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseMobile}
      />

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-slate-200 transition-all duration-300 lg:static ${
          isMobileOpen
            ? 'translate-x-0 w-64'
            : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed && !isMobileOpen ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
