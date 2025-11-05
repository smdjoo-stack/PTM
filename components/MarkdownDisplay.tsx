import React, { useState, useEffect } from 'react';
import { CheckIcon, ClipboardIcon, ArrowPathIcon, ArchiveBoxArrowDownIcon } from './icons';
import type { ConversionResult } from '../types';

// Let TypeScript know that JSZip is available on the global window object
declare const JSZip: any;

interface ResultsDisplayProps {
  results: ConversionResult[];
  onReset: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onReset }) => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  useEffect(() => {
    if (copiedFile) {
      const timer = setTimeout(() => setCopiedFile(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedFile]);

  const handleCopy = (fileName: string, markdown: string) => {
    navigator.clipboard.writeText(markdown).then(() => {
      setCopiedFile(fileName);
    });
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    results.forEach(result => {
        const markdownFileName = result.fileName.replace(/\.pdf$/i, '.md');
        zip.file(markdownFileName, result.markdown);
    });
    
    try {
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'converted-markdown-files.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error("Failed to create ZIP file", error);
        alert("Sorry, there was an error creating the ZIP file.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-gray-900 border-b border-gray-700">
        <h2 className="font-semibold text-lg text-white">Conversion Complete</h2>
        <div className="flex space-x-2">
            <button
              onClick={handleDownloadZip}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-500"
              disabled={results.length === 0}
            >
              <ArchiveBoxArrowDownIcon className="w-5 h-5" />
              <span>Download All (.zip)</span>
            </button>
            <button
                onClick={onReset}
                className="p-2 text-white bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                title="Convert another folder"
            >
                <ArrowPathIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
      <div className="p-4 flex-grow overflow-y-auto space-y-4">
        {results.map((result) => (
            <div key={result.fileName} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                <div className="flex items-center justify-between p-3 bg-gray-800/50">
                    <h3 className="font-mono text-sm text-primary-300">{result.fileName}</h3>
                    <button
                        onClick={() => handleCopy(result.fileName, result.markdown)}
                        className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                    >
                        {copiedFile === result.fileName ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                        <span>{copiedFile === result.fileName ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>
                <pre className="whitespace-pre-wrap break-words text-gray-300 font-mono text-sm leading-relaxed p-4 max-h-60 overflow-y-auto">
                    <code>
                        {result.markdown}
                    </code>
                </pre>
            </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay;
