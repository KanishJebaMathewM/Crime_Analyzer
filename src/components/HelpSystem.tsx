import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, HelpCircle, BarChart3, MapPin, Clock, Target, MessageCircle, Shield, Upload } from 'lucide-react';

interface HelpStep {
  id: string;
  title: string;
  content: string;
  icon: React.ComponentType<any>;
  tips?: string[];
}

const helpSteps: HelpStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Crime Analysis Dashboard',
    content: 'This powerful AI-driven platform helps you analyze crime data, predict patterns, and enhance public safety through advanced analytics and machine learning.',
    icon: HelpCircle,
    tips: [
      'Upload your own crime dataset for personalized analysis',
      'Explore different visualization modes for comprehensive insights',
      'Use AI predictions to make informed safety decisions'
    ]
  },
  {
    id: 'overview',
    title: 'Dashboard Overview',
    content: 'The main dashboard provides key metrics, crime statistics, and quick insights. Monitor total crimes, case closure rates, average victim age, and weapon-related incidents at a glance.',
    icon: BarChart3,
    tips: [
      'Total cases counter shows the complete dataset size',
      'Solved percentage indicates police effectiveness',
      'Armed incidents percentage highlights weapon-related crimes',
      'All metrics update automatically when you upload new data'
    ]
  },
  {
    id: 'upload',
    title: 'Uploading Your Dataset',
    content: 'Click the "Upload Dataset" button to analyze your own crime data. Supports CSV files up to 100MB with up to 200,000 records for comprehensive analysis.',
    icon: Upload,
    tips: [
      'Ensure your CSV has columns: Report Number, Date of Occurrence, City, Crime Description, Victim Age, Victim Gender',
      'Data is processed locally for privacy and security',
      'Large files are processed in chunks for optimal performance',
      'You can download a validation report if there are data quality issues'
    ]
  },
  {
    id: 'city-analysis',
    title: 'City Analysis & Rankings',
    content: 'Explore crime patterns across different cities. View safety ratings, total crimes, closure rates, and demographic insights for each location.',
    icon: MapPin,
    tips: [
      'Safety ratings range from 1.0 (high risk) to 5.0 (very safe)',
      'Click on any city to see detailed safety recommendations',
      'Risk levels are calculated using AI algorithms and historical data',
      'Last incident date helps understand recent crime activity'
    ]
  },
  {
    id: 'time-patterns',
    title: 'Time Pattern Analysis',
    content: 'Understand when crimes are most likely to occur. The time heatmap shows hourly crime distribution and risk levels throughout the day.',
    icon: Clock,
    tips: [
      'Darker colors indicate higher crime frequency',
      'Red hours represent high-risk time periods',
      'Use this data to plan safer travel times',
      'Pattern recognition helps identify peak crime hours'
    ]
  },
  {
    id: 'ai-predictions',
    title: 'AI-Powered Predictions',
    content: 'Advanced machine learning models analyze your data to predict crime patterns, detect anomalies, and provide real-time risk assessments.',
    icon: Target,
    tips: [
      'Predictions are based entirely on historical patterns in your dataset',
      'No default values - all calculations use your actual data',
      'Confidence scores show prediction reliability',
      'Real-time risk assessment helps with immediate safety decisions'
    ]
  },
  {
    id: 'safety-center',
    title: 'Safety Center & Recommendations',
    content: 'Get personalized safety recommendations based on your location and time. Access emergency contact information and safety centers.',
    icon: Shield,
    tips: [
      'Select your city and time for customized safety advice',
      'Emergency contacts include real police, hospital, and fire department numbers',
      'Recommendations are generated based on actual crime data patterns',
      'Safety centers show 24/7 available emergency services'
    ]
  },
  {
    id: 'ai-assistant',
    title: 'AI Chat Assistant',
    content: 'Interact with the AI assistant to ask questions about your crime data, get insights, and receive detailed explanations about patterns and trends.',
    icon: MessageCircle,
    tips: [
      'Ask questions in natural language about your data',
      'Get explanations for complex statistical concepts',
      'Request specific analysis for particular cities or time periods',
      'The assistant can help interpret prediction results'
    ]
  }
];

interface HelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpSystem: React.FC<HelpSystemProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < helpSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentHelpStep = helpSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <currentHelpStep.icon className="w-6 h-6 text-blue-500 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {currentHelpStep.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Step {currentStep + 1} of {helpSteps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              {currentHelpStep.content}
            </p>
          </div>

          {currentHelpStep.tips && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                💡 Tips & Best Practices
              </h4>
              <div className="space-y-3">
                {currentHelpStep.tips.map((tip, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-600 dark:text-gray-400">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special content for specific steps */}
          {currentStep === 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                🚀 Quick Start
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>1. Upload your crime dataset (CSV format)</li>
                <li>2. Explore the Overview tab for key insights</li>
                <li>3. Check AI Predictions for future trends</li>
                <li>4. Use Safety Center for location-specific advice</li>
              </ol>
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                📊 Supported Data Format
              </h4>
              <div className="text-sm text-yellow-800 dark:text-yellow-300 space-y-2">
                <p><strong>Required columns:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• Report Number</li>
                  <li>• Date of Occurrence</li>
                  <li>• City</li>
                  <li>• Crime Description</li>
                  <li>• Victim Age</li>
                  <li>• Victim Gender</li>
                </ul>
                <p className="mt-2"><strong>File limits:</strong> Up to 200,000 rows, 100MB max</p>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                🤖 AI Prediction Information
              </h4>
              <div className="text-sm text-green-800 dark:text-green-300 space-y-2">
                <p><strong>Data-driven approach:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• Uses only your historical data</li>
                  <li>• No artificial defaults or assumptions</li>
                  <li>• Confidence based on sample size</li>
                  <li>• Evidence-based recommendations</li>
                </ul>
                <p className="mt-2"><strong>Accuracy:</strong> Depends on your data quality and completeness</p>
              </div>
            </div>
          )}

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 mt-6">
            {helpSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-500'
                    : index < currentStep
                    ? 'bg-blue-300'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-white bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            {currentStep + 1} of {helpSteps.length}
          </span>

          <button
            onClick={currentStep === helpSteps.length - 1 ? onClose : handleNext}
            className="flex items-center px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            {currentStep === helpSteps.length - 1 ? 'Done' : 'Next'}
            {currentStep < helpSteps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpSystem;
