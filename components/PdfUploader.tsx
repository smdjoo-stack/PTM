import React, { useState, useCallback, useRef } from 'react';
import { ArrowUpTrayIcon } from './icons';

interface PdfUploaderProps {
  onFilesSelect: (files: File[]) => void;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ onFilesSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);
      onFilesSelect(selectedFiles);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const pdfFiles: File[] = [];
    const items = e.dataTransfer.items;

    const traverseFileTree = async (item: any): Promise<void> => {
      if (item.isFile) {
        await new Promise<void>((resolve) => {
          item.file((file: File) => {
            if (file.type === 'application/pdf') {
              pdfFiles.push(file);
            }
            resolve();
          });
        });
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        const entries = await new Promise<any[]>((resolve) => {
          dirReader.readEntries((e: any[]) => resolve(e));
        });
        await Promise.all(entries.map((entry) => traverseFileTree(entry)));
      }
    };
    
    // FIX: Cast item to `any` to access non-standard `webkitGetAsEntry`
    if (items && items.length > 0 && (items[0] as any).webkitGetAsEntry) {
        const entryPromises = Array.from(items).map(item => traverseFileTree((item as any).webkitGetAsEntry()));
        await Promise.all(entryPromises);
    } else {
        // FIX: Cast `e.dataTransfer.files` to `File[]` to resolve type inference issue
         pdfFiles.push(...(Array.from(e.dataTransfer.files) as File[]).filter(f => f.type === 'application/pdf'));
    }

    if (pdfFiles.length > 0) {
      onFilesSelect(pdfFiles);
    } else {
      alert('No PDF files found in the dropped items.');
    }
  }, [onFilesSelect]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const dragClasses = isDragging ? 'border-primary-500 bg-primary-900/20' : 'border-gray-600 hover:border-primary-500';

  return (
    <div
      className={`w-full max-w-lg p-8 md:p-12 border-2 border-dashed rounded-xl transition-all duration-300 text-center cursor-pointer ${dragClasses}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        // FIX: Corrected typo in ref from `fileInput-Ref` to `fileInputRef`
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        webkitdirectory=""
        mozdirectory=""
      />
      <div className="flex flex-col items-center justify-center space-y-4 text-gray-400">
        <ArrowUpTrayIcon className="w-16 h-16 text-gray-500" />
        <h2 className="text-xl font-semibold text-gray-200">Drag & Drop a Folder of PDFs Here</h2>
        <p>or</p>
        <button
            type="button"
            className="px-5 py-2.5 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors duration-300"
        >
            Select Folder
        </button>
        <p className="text-sm text-gray-500 mt-2">All PDFs in the folder will be processed.</p>
      </div>
    </div>
  );
};

export default PdfUploader;