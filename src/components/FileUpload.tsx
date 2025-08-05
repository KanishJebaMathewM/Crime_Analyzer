import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Eye, 
  Download,
  AlertTriangle,
  Info
} from 'lucide-react';
import { CSVValidator, CSVPreviewData } from '../utils/csvValidator';
import { DataValidationResult, ProcessingProgress } from '../types/crime';

interface FileUploadProps {
  onDataLoaded: (data: any[]) => void;
  onClose: () => void;
}

type UploadStep = 'select' | 'preview' | 'processing' | 'validation' | 'success' | 'error';

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onClose }) => {
  const [currentStep, setCurrentStep] = useState<UploadStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<CSVPreviewData | null>(null);
  const [validationResult, setValidationResult] = useState<DataValidationResult | null>(null);
  const [progress, setProgress] = useState<ProcessingProgress>({ current: 0, total: 100, stage: '' });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvValidator = new CSVValidator({}, setProgress);

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
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setSelectedFile(file);
    
    // Validate file
    const fileValidation = csvValidator.validateFile(file);
    if (!fileValidation.valid) {
      setError(fileValidation.errors.join(', '));
      setCurrentStep('error');
      return;
    }

    try {
      setCurrentStep('preview');
      const preview = await csvValidator.previewCSV(file, 5);
      setPreviewData(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview file');
      setCurrentStep('error');
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile) return;

    try {
      setCurrentStep('processing');
      const result = await csvValidator.processCSV(selectedFile);
      setValidationResult(result);
      setCurrentStep('validation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
      setCurrentStep('error');
    }
  };

  const handleConfirmData = () => {
    if (validationResult && validationResult.validRecords.length > 0) {
      setCurrentStep('success');
      setTimeout(() => {
        onDataLoaded(validationResult.validRecords);
        onClose();
      }, 1500);
    }
  };

  const handleDownloadReport = () => {
    if (validationResult) {
      csvValidator.downloadValidationReport(
        validationResult,
        `validation-report-${selectedFile?.name || 'data'}.txt`
      );
    }
  };

  const resetUpload = () => {
    setCurrentStep('select');
    setSelectedFile(null);
    setPreviewData(null);
    setValidationResult(null);
    setError(null);
    setProgress({ current: 0, total: 100, stage: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderFileSelection = () => (
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
          or click to browse files (Max 50MB, up to 100,000 rows)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInputChange}
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
  );

  const renderPreview = () => (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            File Preview: {selectedFile?.name}
          </h3>
          <button
            onClick={resetUpload}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400">File Size</div>
            <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400">Estimated Rows</div>
            <div className="text-lg font-semibold text-green-900 dark:text-green-100">
              ~{previewData?.totalRows.toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <div className="text-sm text-purple-600 dark:text-purple-400">Processing Time</div>
            <div className="text-lg font-semibold text-purple-900 dark:text-purple-100">
              ~{previewData?.estimatedProcessingTime}s
            </div>
          </div>
        </div>

        {previewData && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              First 5 rows:
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    {previewData.headers.map((header, index) => (
                      <th key={index} className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-300">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-gray-200 dark:border-gray-600">
                      {previewData.headers.map((header, colIndex) => (
                        <td key={colIndex} className="px-2 py-1 text-gray-800 dark:text-gray-200">
                          {String(row[header] || '').substring(0, 50)}
                          {String(row[header] || '').length > 50 && '...'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={resetUpload}
          className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Select Different File
        </button>
        <button
          onClick={handleProcessFile}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Eye className="w-4 h-4 mr-2 inline" />
          Process File
        </button>
      </div>
    </>
  );

  const renderProcessing = () => (
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
        {progress.recordsProcessed && (
          <span className="ml-2">
            ({progress.recordsProcessed.toLocaleString()} records processed)
          </span>
        )}
      </p>
    </div>
  );

  const renderValidation = () => (
    <>
      {validationResult && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Validation Results
            </h3>
            <button
              onClick={handleDownloadReport}
              className="flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              Download Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Rows</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {validationResult.summary.totalRows.toLocaleString()}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400">Valid Records</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {validationResult.summary.validRows.toLocaleString()}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="text-sm text-red-600 dark:text-red-400">Invalid Records</div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                {validationResult.summary.invalidRows.toLocaleString()}
              </div>
            </div>
          </div>

          {validationResult.summary.errorRate > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Data Quality Issues Found
                </h4>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {validationResult.summary.errorRate.toFixed(1)}% of rows contain validation errors. 
                Invalid records will be excluded from analysis.
              </p>
              
              {validationResult.invalidRecords.length > 0 && (
                <div className="mt-3">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100">
                      View first 3 errors
                    </summary>
                    <div className="mt-2 space-y-2">
                      {validationResult.invalidRecords.slice(0, 3).map((invalid, index) => (
                        <div key={index} className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded text-xs">
                          <div className="font-medium">Row {invalid.rowIndex + 1}:</div>
                          <ul className="list-disc list-inside mt-1">
                            {invalid.errors.map((error, errorIndex) => (
                              <li key={errorIndex}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}

          {validationResult.summary.validRows > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Ready to Proceed
                </h4>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {validationResult.summary.validRows.toLocaleString()} valid records are ready for analysis.
              </p>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={resetUpload}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Upload Different File
            </button>
            <button
              onClick={handleConfirmData}
              disabled={validationResult.summary.validRows === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Use This Data
            </button>
          </div>
        </div>
      )}
    </>
  );

  const renderSuccess = () => (
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
  );

  const renderError = () => (
    <div className="space-y-4">
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
      
      <div className="flex justify-center">
        <button
          onClick={resetUpload}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'select':
        return renderFileSelection();
      case 'preview':
        return renderPreview();
      case 'processing':
        return renderProcessing();
      case 'validation':
        return renderValidation();
      case 'success':
        return renderSuccess();
      case 'error':
        return renderError();
      default:
        return renderFileSelection();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FileSpreadsheet className="w-6 h-6 text-blue-500 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Upload Crime Dataset
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Step {
                  currentStep === 'select' ? '1' :
                  currentStep === 'preview' ? '2' :
                  currentStep === 'processing' ? '3' :
                  currentStep === 'validation' ? '4' : '5'
                } of 5
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
