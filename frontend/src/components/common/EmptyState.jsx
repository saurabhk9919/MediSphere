import React from 'react';

const EmptyState = ({
  title = 'No Data Available',
  description = 'There is currently no information to display here.',
  icon = '📂',
  actionButton = null,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/40 backdrop-blur-xs max-w-md mx-auto ${className}`}>
      <div className="text-4xl mb-4 p-3 bg-slate-200 dark:bg-slate-800/80 rounded-2xl border border-slate-300 dark:border-slate-700/60 inline-flex items-center justify-center shadow-inner select-none">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{description}</p>
      {actionButton}
    </div>
  );
};

export default EmptyState;
