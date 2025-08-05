import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Processing Crime Data
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {message}
        </p>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-64 mx-auto overflow-hidden">
          <div className="bg-blue-500 h-full rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Optimizing data processing for better performance...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;