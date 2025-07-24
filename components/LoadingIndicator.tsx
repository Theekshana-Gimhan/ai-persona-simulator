
import React from 'react';

interface LoadingIndicatorProps {
  text: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ text }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
      <div className="w-16 h-16 border-4 border-t-cyan-400 border-r-cyan-400 border-b-slate-600 border-l-slate-600 rounded-full animate-spin mb-6"></div>
      <h2 className="text-2xl font-bold text-slate-200">{text}</h2>
    </div>
  );
};

export default LoadingIndicator;
