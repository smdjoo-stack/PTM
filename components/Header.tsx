
import React from 'react';
import { DocumentTextIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-4 shadow-lg sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-center space-x-3">
        <DocumentTextIcon className="w-8 h-8 text-primary-400" />
        <h1 className="text-2xl font-bold text-white tracking-tight">
          PDF to Markdown Converter
        </h1>
      </div>
    </header>
  );
};

export default Header;
