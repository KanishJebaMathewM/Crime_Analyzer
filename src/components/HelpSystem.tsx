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
    title: 'Welcome to Crime Analysis Dashboard',
    content: 'A comprehensive AI-powered platform for crime data analysis, safety insights, and predictive analytics. Upload your data or use demo data to get started.',
    icon: HelpCircle,
    tips: [
      'Upload CSV files with crime data',
      'Get AI-powered predictions and insights',
      'Access safety recommendations',
      'View city comparisons and demographics'
    ]
  },
  {
    id: 'overview',
    title: 'Dashboard Overview',
    content: 'The main dashboard shows key crime statistics including total cases, closure rates, average victim age, and weapon-related incidents with AI accuracy metrics.',
    icon: BarChart3,
    tips: [
      'View total crimes across all cities',
      'Track case closure rates',
      'Monitor weapon-related incidents',
      'See AI prediction accuracy'
    ]
  },
  {
    id: 'data-upload',
    title: 'Data Upload & Management',
    content: 'Upload your crime data in CSV format. The system will validate and process your data for analysis. You can also refresh data or load the demo dataset.',
    icon: Upload,
    tips: [
      'CSV format with required columns',
      'Real-time data validation',
      'Switch between demo and uploaded data',
      'Refresh data when needed'
    ]
  },
  {
    id: 'predictions',
    title: 'AI Predictions',
    content: 'Get data-driven crime predictions based on your historical data. View city-specific predictions, time patterns, and real-time risk assessments.',
    icon: Target,
    tips: [
      'Predictions based on your actual data',
      'City-specific risk analysis',
      'Hourly pattern predictions',
      'Confidence scores for reliability'
    ]
  },
  {
    id: 'city-analysis',
    title: 'City Analysis & Rankings',
    content: 'Compare crime statistics across different cities. View safety rankings, crime rates, and detailed city-specific information.',
    icon: MapPin,
    tips: [
      'Safety rankings from safest to highest risk',
      'City-specific crime statistics',
      'Compare multiple cities',
      'View detailed city profiles'
    ]
  },
  {
    id: 'time-patterns',
    title: 'Time Pattern Analysis',
    content: 'Analyze when crimes occur throughout the day. See hour-by-hour risk levels with interactive heatmaps and safety recommendations.',
    icon: Clock,
    tips: [
      'Hour-by-hour crime frequency',
      'Visual risk level indicators',
      'Peak crime time identification',
      'Safety recommendations by time'
    ]
  },
  {
    id: 'demographics',
    title: 'Demographics Analysis',
    content: 'Explore victim demographics including age groups, gender distribution, and patterns across different cities and crime types.',
    icon: Users,
    tips: [
      'Age and gender breakdowns',
      'City-specific demographics',
      'Crime type correlations',
      'Trend analysis over time'
    ]
  },
  {
    id: 'safety-center',
    title: 'Safety Center',
    content: 'Access safety recommendations, emergency contacts, and incident analysis. Get location-specific safety advice and emergency information.',
    icon: Shield,
    tips: [
      'Emergency contact information',
      'Location-based safety tips',
      'Incident analysis and patterns',
      'Real safety recommendations'
    ]
  },
  {
    id: 'ai-assistant',
    title: 'AI Chat Assistant',
    content: 'Ask questions about your crime data in natural language. Get explanations, insights, and help interpreting the analysis results.',
    icon: MessageCircle,
    tips: [
      'Ask questions in plain English',
      'Get data explanations',
      'Understand analysis results',
      'Request specific insights'
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
