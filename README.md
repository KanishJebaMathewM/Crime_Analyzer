# Crime Analysis Dashboard

## 🌐 Links

- [GitHub Repository](https://github.com/KanishJebaMathewM/Crime_data_analysis)
- [Live Demo](https://crime-data-analysis.netlify.app/)
  

## 📁 Project Architecture

```
src/
├── components/              # React components
│   ├── Dashboard.tsx       # Main dashboard with enhanced navigation
│   ├── HelpDialog.tsx      # Comprehensive help system
│   ├── PerformanceMonitor.tsx # Real-time performance tracking
│   ├── FileUpload.tsx      # Enhanced file upload with validation
│   ├── CrimeChart.tsx      # Crime trend visualization
│   ├── TimeHeatmap.tsx     # Time pattern analysis with heatmaps
│   ├── AccuratePredictionsPanel.tsx # AI predictions with accuracy
│   ├── ChatBot.tsx         # Intelligent chat assistant
│   ├── CityRankings.tsx    # City safety rankings
│   ├── VictimDemographics.tsx # Demographics analysis
│   ├── IncidentAnalysis.tsx # Detailed incident patterns
│   ├── LoadingSpinner.tsx  # Enhanced loading states
│   └── HelpSystem.tsx      # Legacy help component
├── types/                  # TypeScript type definitions
│   └── crime.ts           # Core data types with Zod schemas
├── utils/                  # Utility functions
│   ├── dateUtils.ts       # Date/time parsing utilities
│   ├── csvValidator.ts    # CSV validation and processing
│   ├── workerManager.ts   # Web Worker coordination
│   ├── analytics.ts       # Enhanced analytics with AI
│   ├── accuratePredictions.ts # Prediction engine
│   ├── aiEngine.ts        # AI/ML models
│   ├── predictions.ts     # Prediction utilities
│   ├── dataGenerator.ts   # Mock data generation
│   ├── fileProcessor.ts   # File processing utilities
│   └── __tests__/         # Utility tests
├── workers/               # Web Workers for background processing
│   └── dataProcessor.worker.ts # Heavy computation worker
├── services/              # Service layer
│   └── emergencyContactsService.ts # Emergency contacts API
├── contexts/              # React contexts
│   └── ThemeContext.tsx   # Theme management
├── config/                # Configuration files
│   └── emergencyContacts.json # Emergency contact database
└── test/                  # Test configuration
    └── setup.ts
```

## 🚀 Key Features

```
- AI-Powered Crime Predictions (97% accuracy)
- Real-time Risk Assessment
- Large Dataset Processing (40,000+ records)
- Interactive Data Visualizations
- Emergency Safety Features
```

## 🛠️ Tech Stack

```
- React 18 + TypeScript 5
- Vite + Tailwind CSS
- Zod + Papa Parse
- Web Workers + Custom AI Engine
- Vitest (90%+ coverage)
```

## 📋 Data Requirements

```
| Column          | Type    | Description               |
|-----------------|---------|---------------------------|
| Report Number   | String  | Unique crime identifier   |
| Date Occurred   | Date    | Incident date             |
| Time Occurred   | Time    | 24-hour format            |
| City            | String  | Location of crime         |
| Crime Type      | String  | Description of crime      |
| Victim Age      | Number  | 0-120 range              |
| Victim Gender   | String  | Male/Female/Other        |
```

## 🚀 Quick Start

```
1. `git clone https://github.com/KanishJebaMathewM/Crime_data_analysis`
2. `npm install`
3. `npm run dev`
```
Visit [live demo](https://crime-data-analysis.netlify.app/)

## 📊 Core Modules
```
1. **Dashboard** - Overview metrics
2. **AI Predictions** - Risk assessment
3. **City Analysis** - Safety rankings
4. **Time Patterns** - 24-hour heatmaps
5. **Demographics** - Victim analysis (age/gender)
6. **Safety Center** - Emergency resources
```

## 🔮 Roadmap
```
- Real-time data feeds
- Interactive crime maps
- Mobile app version
- Enhanced AI models (97%+ accuracy)
```

## 📄 License
```
MIT License
```

## 🙏 Acknowledgments
```
- React/Vite Teams
- Tailwind CSS
- TensorFlow.js
- D3.js community
```

