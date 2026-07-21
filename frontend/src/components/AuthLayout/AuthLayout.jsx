import React from 'react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 bg-gradient-to-br from-slate-950 via-indigo-950/70 to-slate-900 p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">

      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl shadow-indigo-950/50 p-6 sm:p-8 z-10 transition-all duration-300">

        <div className="flex flex-col items-center text-center mb-8">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 font-bold text-lg mb-4 shadow-xs">
            <span className="text-2xl">🩺</span>
            <span className="tracking-tight font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
              MediSphere
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 text-sm text-slate-400 max-w-xs">
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
