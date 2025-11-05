import React, { useState, useCallback } from 'react';
import type { PdfContentPart, ConversionResult } from './types';
import { extractContentFromPdf } from './services/pdfService';
import { convertContentToMarkdown } from './services/geminiService';
import Header from './components/Header';
import PdfUploader from './components/PdfUploader';
import ResultsDisplay from './components/MarkdownDisplay';
import Loader from './components/Loader';
import { ArrowPathIcon } from './components/icons';

type Status = 'idle' | 'processing' | 'success' | 'error';

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const handleFilesSelect = (selectedFiles: File[]) => {
    const pdfFiles = selectedFiles.filter(f => f.name.toLowerCase().endsWith('.pdf'));
     if (pdfFiles.length > 0) {
        setFiles(pdfFiles);
        setResults([]);
        setStatus('idle');
        setError(null);
     } else {
        setError("No PDF files found in the selected folder.");
        setStatus('error');
     }
  };

  const handleConversion = useCallback(async () => {
    if (files.length === 0) {
      setError('Please select a folder with PDF files first.');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setError(null);
    setProgress({ current: 0, total: files.length });
    const newResults: ConversionResult[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: files.length });
        const pdfParts: PdfContentPart[] = await extractContentFromPdf(file);
        
        if (pdfParts.length === 0) {
            console.warn(`No content extracted from ${file.name}, skipping.`);
            continue;
        }

        const generatedMarkdown = await convertContentToMarkdown(pdfParts);
        newResults.push({ fileName: file.name, markdown: generatedMarkdown });
      }
      setResults(newResults);
      setStatus('success');
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during conversion.';
      setError(`Conversion failed: ${errorMessage}`);
      setStatus('error');
    } finally {
        setProgress(null);
    }
  }, [files]);

  const handleReset = () => {
    setFiles([]);
    setResults([]);
    setStatus('idle');
    setError(null);
    setProgress(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 w-full max-w-4xl flex flex-col">
        {status === 'success' ? (
          <ResultsDisplay results={results} onReset={handleReset} />
        ) : status === 'processing' ? (
          <Loader progress={progress} />
        ) : (
           <div className="w-full h-full flex flex-col justify-center items-center">
             {files.length === 0 && <PdfUploader onFilesSelect={handleFilesSelect} />}
             
             {files.length > 0 && (
                <div className="text-center bg-gray-800 p-8 rounded-lg shadow-lg w-full">
                    <p className="text-lg mb-4">
                        Ready to convert <span className="font-semibold text-primary-400">{files.length}</span> PDF file(s).
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={handleConversion}
                        className="px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors duration-300 disabled:bg-gray-500"
                        disabled={status === 'processing'}
                      >
                        {status === 'processing' ? 'Processing...' : 'Start Conversion'}
                      </button>
                      <button
                        onClick={handleReset}
                        className="p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-300"
                        title="Start Over"
                      >
                        <ArrowPathIcon className="w-6 h-6" />
                      </button>
                    </div>
                </div>
             )}

            {error && (
              <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg w-full text-center">
                <p className="font-semibold">Error</p>
                <p>{error}</p>
              </div>
            )}
           </div>
        )}
      </main>
    </div>
  );
};

export default App;
