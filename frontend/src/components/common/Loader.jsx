import React from 'react';

const Loader = ({ size = 'medium', className = '', fullScreen = false }) => {
  const sizeClasses = {
    small: 'h-5 w-5 border-2',
    medium: 'h-10 w-10 border-4',
    large: 'h-16 w-16 border-4',
  };

  const loaderContent = (
    <div className={`animate-spin rounded-full border-slate-700 border-t-indigo-500 ${sizeClasses[size]} ${className}`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
        {loaderContent}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-4">{loaderContent}</div>;
};

export default Loader;
