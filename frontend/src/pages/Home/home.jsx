import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button/Button.jsx';

function Home() {
  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-950 via-indigo-950/60 to-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🩺</span>
            <span className="font-extrabold text-xl bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
              MediSphere
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-16 relative overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 shadow-xs">
            ✨ Healthcare Platform of the Future
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
            Modern Healthcare Management with{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
              MediSphere
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Seamlessly connect patients with world-class healthcare professionals, manage appointments, and track medical records effortless in one unified platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button variant="primary" fullWidth className="text-base px-8 py-3">
                Join MediSphere Today →
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" fullWidth className="text-base px-8 py-3">
                Sign In to Account
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800">
        © {new Date().getFullYear()} MediSphere Healthcare Systems. All rights reserved.
      </footer>
    </div>
  );
}

export default Home;