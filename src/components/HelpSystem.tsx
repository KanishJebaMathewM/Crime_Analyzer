import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, HelpCircle, BarChart3, MapPin, Clock, Target, MessageCircle, Shield, Upload, Users } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border-2 border-blue-400">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-400 bg-blue-800">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-xl mr-4">
              <currentHelpStep.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {currentHelpStep.title}
              </h2>
              <p className="text-sm text-blue-200">
                Step {currentStep + 1} of {helpSteps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-blue-700 text-xl font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-8">
            <p className="text-white text-lg leading-relaxed mb-6">
              {currentHelpStep.content}
            </p>

            <div className="bg-blue-800 rounded-xl p-6 border border-blue-400">
              <h4 className="text-lg font-bold text-blue-200 mb-4 flex items-center">
                💡 Key Features
              </h4>
              <ul className="space-y-3">
                {currentHelpStep.tips.map((tip, index) => (
                  <li key={index} className="flex items-start text-blue-100">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-base">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-3 mb-6">
            {helpSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-blue-300 scale-125 shadow-lg'
                    : index < currentStep
                    ? 'bg-blue-400'
                    : 'bg-blue-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-blue-400 bg-blue-800">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all min-w-[120px] ${
              currentStep === 0
                ? 'text-blue-400 cursor-not-allowed bg-blue-900'
                : 'text-white bg-blue-600 hover:bg-blue-500 shadow-lg hover:shadow-xl'
            }`}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </button>

          <div className="text-center">
            <span className="text-lg font-bold text-blue-200">
              {currentStep + 1} of {helpSteps.length}
            </span>
          </div>

          <button
            onClick={handleNext}
            className="flex items-center px-6 py-3 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-400 transition-all shadow-lg hover:shadow-xl min-w-[120px]"
          >
            {currentStep === helpSteps.length - 1 ? 'Finish' : 'Next'}
            {currentStep < helpSteps.length - 1 && <ChevronRight className="w-5 h-5 ml-2" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpSystem;
