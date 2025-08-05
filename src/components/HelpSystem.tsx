import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, HelpCircle, BarChart3, MapPin, Clock, Target, MessageCircle, Shield, Upload } from 'lucide-react';

interface HelpStep {
  id: string;
  title: string;
  content: string;
  icon: React.ComponentType<any>;
  tips: string[];
}

const helpSteps: HelpStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Crime Dashboard',
    content: 'AI-powered crime analysis platform for data-driven safety insights and predictions.',
    icon: HelpCircle,
    tips: [
      'Upload CSV files up to 200K records',
      'Get real-time AI predictions',
      'Access emergency contact info'
    ]
  },
  {
    id: 'overview',
    title: 'Dashboard Overview',
    content: 'View key metrics: total crimes, closure rates, victim demographics, and weapon incidents.',
    icon: BarChart3,
    tips: [
      'Metrics update with new data',
      'Color-coded risk indicators',
      'Accuracy shows prediction quality'
    ]
  },
  {
    id: 'upload',
    title: 'Data Upload',
    content: 'Upload CSV files with crime data. Required columns: Report Number, Date, City, Crime Type, Age, Gender.',
    icon: Upload,
    tips: [
      'CSV format only, 100MB max',
      'Data processed locally',
      'Validation reports available'
    ]
  },
  {
    id: 'city-analysis',
    title: 'City Analysis',
    content: 'Compare safety ratings, crime patterns, and demographics across different cities.',
    icon: MapPin,
    tips: [
      'Safety ratings: 1.0 (high risk) to 5.0 (safe)',
      'AI-calculated risk levels',
      'Historical incident tracking'
    ]
  },
  {
    id: 'time-patterns',
    title: 'Time Patterns',
    content: 'Analyze crime frequency by hour. Red = high risk, Green = safe periods.',
    icon: Clock,
    tips: [
      '24-hour risk visualization',
      'Pattern-based recommendations',
      'Peak crime hour identification'
    ]
  },
  {
    id: 'ai-predictions',
    title: 'AI Predictions',
    content: 'Data-driven predictions using your historical crime data. No defaults - only real patterns.',
    icon: Target,
    tips: [
      'Based entirely on your data',
      'Confidence scores included',
      'Evidence-based recommendations'
    ]
  },
  {
    id: 'safety-center',
    title: 'Safety & Emergency',
    content: 'Access emergency contacts, safety recommendations, and incident analysis for specific locations.',
    icon: Shield,
    tips: [
      'Real emergency numbers',
      'Location-specific advice',
      'Incident trend analysis'
    ]
  },
  {
    id: 'ai-assistant',
    title: 'AI Chat Assistant',
    content: 'Ask questions about your crime data in natural language. Get insights and explanations.',
    icon: MessageCircle,
    tips: [
      'Natural language queries',
      'Data interpretation help',
      'Pattern explanations'
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
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentHelpStep = helpSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
              <currentHelpStep.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentHelpStep.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Step {currentStep + 1} of {helpSteps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-4">
              {currentHelpStep.content}
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                💡 Quick Tips
              </h4>
              <ul className="space-y-1">
                {currentHelpStep.tips.map((tip, index) => (
                  <li key={index} className="flex items-start text-sm text-blue-800 dark:text-blue-300">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            {helpSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-blue-500 scale-125'
                    : index < currentStep
                    ? 'bg-blue-300'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation - Fixed positioning */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all min-w-[100px] ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
                : 'text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {currentStep + 1} / {helpSteps.length}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 min-w-[100px]"
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
