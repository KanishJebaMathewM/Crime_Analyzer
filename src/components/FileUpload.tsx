import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { ExcelProcessor, ProcessingProgress } from '../utils/fileProcessor';

interface FileUploadProps {
  onDataLoaded: (data: any[]) => void;
  onClose: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({ current: 0, total: 100, stage: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    setError(null);
    setSuccess(false);
    
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please upload a valid Excel file (.xlsx, .xls) or CSV file.');
      return;
    }

    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size too large. Please upload a file smaller than 50MB.');
      return;
    }

    setIsProcessing(true);
    
    try {
      const processor = new ExcelProcessor((progress) => {
        setProgress(progress);
      });
      
      const data = await processor.processFile(file);
      
      if (data.length === 0) {
        setError('No valid data found in the file. Please check the file format.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onDataLoaded(data);
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error('Error processing file:', err);
      setError(err instanceof Error ? err.message : 'Failed to process file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FileSpreadsheet className="w-6 h-6 text-blue-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Upload Crime Dataset
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!isProcessing && !success && (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Supported File Formats
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Excel (.xlsx)</span>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">Excel (.xls)</span>
                  </div>
                  <div className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-200">CSV (.csv)</span>
                  </div>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Expected Columns:
                  </h4>
                  <div className="text-xs text-yellow-700 dark:text-yellow-300 grid grid-cols-2 gap-1">
                    <span>• Report Number</span>
                    <span>• Date Reported</span>
                    <span>• Date of Occurrence</span>
                    <span>• Time of Occurrence</span>
                    <span>• City</span>
                    <span>• Crime Code</span>
                    <span>• Crime Description</span>
                    <span>• Victim Age</span>
                    <span>• Victim Gender</span>
                    <span>• Weapon Used</span>
                    <span>• Crime Domain</span>
                    <span>• Police Deployed</span>
                    <span>• Case Closed</span>
                    <span>• Date Case Closed</span>
                  </div>
                </div>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Drop your Excel file here
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  or click to browse files (Max 50MB, up to 50,000+ rows)
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </label>
              </div>
            </>
          )}

          {isProcessing && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
                <FileSpreadsheet className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Processing Your Dataset
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {progress.stage}
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress.current}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">
                {Math.round(progress.current)}% complete
              </p>
            </div>
          )}

          {success && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Upload Successful!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your dataset has been processed and loaded successfully.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Upload Error
                </h4>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
