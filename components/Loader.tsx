import React from 'react';

interface LoaderProps {
  progress?: { current: number; total: number } | null;
}

const Loader: React.FC<LoaderProps> = ({ progress }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-800/50 p-10 rounded-lg">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-500"></div>
      <p className="mt-6 text-xl font-semibold text-white tracking-wider">
        {progress ? `Converting PDF ${progress.current} of ${progress.total}...` : 'Processing your request...'}
      </p>
      <p className="mt-2 text-gray-400">
        This may take a moment for large or complex files.
      </p>
    </div>
  );
};

export default Loader;
