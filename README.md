# Crime Data Analysis Dashboard

A comprehensive, enterprise-grade React application for analyzing crime data with advanced data processing, validation, and visualization capabilities.

## 🚀 Features

### Data Processing & Validation
- **Robust CSV/Excel Processing**: Support for multiple file formats with advanced parsing
- **Data Quality Validation**: Comprehensive validation with detailed error reporting
- **Type Safety**: Full TypeScript integration with Zod schema validation
- **Performance Optimization**: Web Workers for heavy computations to maintain UI responsiveness
- **Large Dataset Support**: Efficient processing of 100,000+ records

### Analytics & Visualization
- **City Safety Analysis**: Comprehensive safety ratings and risk assessments
- **Time Pattern Analysis**: Hour-by-hour crime pattern identification
- **Interactive Dashboards**: Real-time data visualization with responsive design
- **Predictive Analytics**: Crime trend prediction and hotspot identification
- **Emergency Contacts**: Location-based emergency service information

### User Experience
- **Accessibility First**: WCAG 2.1 AA compliant with full keyboard navigation
- **Mobile Responsive**: Optimized for all device sizes
- **Progressive Upload**: Multi-step file upload with preview and validation
- **Error Recovery**: Graceful error handling with actionable feedback
- **Real-time Progress**: Live progress indicators for all operations

### Security & Quality
- **Input Sanitization**: Comprehensive protection against XSS and injection attacks
- **File Type Validation**: Strict file type and size validation
- **Error Boundaries**: Robust error containment and reporting
- **Testing Coverage**: Comprehensive unit and integration tests

## 🛠️ Technology Stack

### Core Technologies
- **React 18** - Modern React with Hooks and Concurrent Features
- **TypeScript 5** - Type-safe development with advanced type checking
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework

### Data Processing
- **Zod** - Runtime type validation and schema management
- **Papa Parse** - High-performance CSV parsing
- **date-fns** - Comprehensive date/time utilities
- **Web Workers** - Background processing for heavy computations

### Testing & Quality
- **Vitest** - Fast unit testing framework
- **Testing Library** - React component testing utilities
- **ESLint** - Code quality and style enforcement
- **TypeScript** - Compile-time type checking

### Additional Libraries
- **Lucide React** - Modern icon library
- **React Window** - Virtualization for large datasets
- **XLSX** - Excel file processing

## 📋 Prerequisites

- **Node.js** 18.0 or higher
- **npm** 8.0 or higher (or yarn/pnpm equivalent)
- Modern web browser with ES2020 support

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd crime-analysis-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Access the Application

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Upload Sample Data

Use the sample CSV file in the `public` directory or upload your own crime dataset following the required format.

## 📊 Data Format Specification

### Required Columns

Your CSV file must include these columns (case-insensitive, various naming conventions supported):

| Column | Alternative Names | Type | Description |
|--------|------------------|------|-------------|
| Report Number | ReportNumber, report_number, ID | String | Unique identifier for the crime report |
| Date of Occurrence | DateOfOccurrence, date_of_occurrence | Date | When the crime occurred |
| Time of Occurrence | TimeOfOccurrence, time_of_occurrence | Time | Time when the crime occurred (HH:MM format) |
| City | city, Location | String | City where the crime occurred |
| Crime Description | CrimeDescription, crime_description | String | Description of the crime type |
| Victim Age | VictimAge, victim_age, Age | Number | Age of the victim (0-120) |
| Victim Gender | VictimGender, victim_gender, Gender | String | Gender (Male/Female/Other) |

### Optional Columns

| Column | Alternative Names | Type | Description |
|--------|------------------|------|-------------|
| Date Reported | DateReported, date_reported | Date | When the crime was reported |
| Crime Code | CrimeCode, crime_code | String | Official crime classification code |
| Weapon Used | WeaponUsed, weapon_used | String | Weapon involved in the crime |
| Crime Domain | CrimeDomain, crime_domain | String | Category/domain of the crime |
| Police Deployed | PoliceDeployed, police_deployed | Boolean | Whether police were deployed |
| Case Closed | CaseClosed, case_closed | String | Case status (Yes/No) |
| Date Case Closed | DateCaseClosed, date_case_closed | Date | When the case was closed |

### Supported Date Formats
- DD/MM/YYYY, DD-MM-YYYY
- MM/DD/YYYY, MM-DD-YYYY  
- YYYY-MM-DD, YYYY/MM/DD
- Excel date numbers
- ISO 8601 format

### Supported Time Formats
- HH:MM, HH:MM:SS
- H:MM AM/PM
- Excel time fractions

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in UI Mode
```bash
npm run test:ui
```

### Run Specific Test Files
```bash
npm test -- dateUtils
npm test -- csvValidator
```

## 🏗️ Build & Deployment

### Development Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── Dashboard.tsx    # Main dashboard component
│   ├── FileUpload.tsx   # Enhanced file upload with validation
│   ├── CrimeChart.tsx   # Crime trend visualization
│   ├── TimeHeatmap.tsx  # Time pattern analysis
│   └── __tests__/       # Component tests
├── types/               # TypeScript type definitions
│   └── crime.ts         # Core data types with Zod schemas
├── utils/               # Utility functions
│   ├── dateUtils.ts     # Date/time parsing utilities
│   ├── csvValidator.ts  # CSV validation and processing
│   ├── workerManager.ts # Web Worker coordination
│   └── __tests__/       # Utility tests
├── workers/             # Web Workers for background processing
│   └── dataProcessor.worker.ts
├── services/            # Service layer
│   └── emergencyContactsService.ts
├── config/              # Configuration files
│   └── emergencyContacts.json
└── test/                # Test configuration
    └── setup.ts
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_APP_TITLE=Crime Analysis Dashboard
VITE_MAX_FILE_SIZE=52428800  # 50MB
VITE_MAX_RECORDS=100000
```

### CSV Processing Configuration

Modify `src/utils/csvValidator.ts` to adjust processing limits:

```typescript
export const DEFAULT_CSV_CONFIG: CSVValidationConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxRows: 100000,
  allowedMimeTypes: ['text/csv', 'application/csv'],
  requiredColumns: [...],
  strictValidation: false,
  skipEmptyRows: true,
  trimWhitespace: true,
};
```

## 🔒 Security Considerations

### File Upload Security
- Strict file type validation (CSV/Excel only)
- File size limits to prevent DoS
- Content sanitization to prevent XSS
- No server-side file storage (client-side processing only)

### Data Privacy
- All data processing happens client-side
- No data is sent to external servers
- Users can clear data at any time
- No persistent storage of sensitive data

### Input Validation
- All user inputs are validated and sanitized
- SQL injection protection (though no database is used)
- XSS prevention through proper escaping
- File content validation before processing

## ♿ Accessibility Features

### Keyboard Navigation
- Full keyboard accessibility for all interactive elements
- Logical tab order throughout the application
- Focus indicators for all focusable elements
- Keyboard shortcuts for common actions

### Screen Reader Support
- Semantic HTML structure
- ARIA labels and descriptions
- Screen reader announcements for dynamic content
- Alternative text for visual elements

### Visual Accessibility
- High contrast color schemes
- Scalable text and UI elements
- Clear visual hierarchy
- Color-blind friendly palette

## 🐛 Troubleshooting

### Common Issues

#### File Upload Fails
```bash
# Check file format and size
# Ensure CSV has required columns
# Verify data types in CSV
```

#### Performance Issues with Large Files
```bash
# Reduce file size or split into smaller files
# Use CSV format instead of Excel
# Close other browser tabs
# Increase browser memory if possible
```

#### Date/Time Parsing Errors
```bash
# Check date format in CSV (DD/MM/YYYY recommended)
# Ensure time format is HH:MM
# Remove empty date/time cells
# Use consistent date format throughout file
```

### Getting Help

1. Check the browser console for detailed error messages
2. Download validation reports for data quality issues
3. Review the sample data format in `public/crime_dataset_india.csv`
4. Check the GitHub issues for known problems

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`
5. Run tests: `npm test`
6. Submit a pull request

### Code Standards

- **TypeScript**: All new code must be fully typed
- **Testing**: Unit tests required for all utilities and services
- **Accessibility**: Components must meet WCAG 2.1 AA standards
- **Performance**: Consider performance impact of new features
- **Documentation**: Update documentation for new features

### Commit Guidelines

Use conventional commits:
```
feat: add new feature
fix: bug fix
docs: documentation changes
test: add or update tests
refactor: code refactoring
style: formatting changes
perf: performance improvements
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Date-fns** for robust date/time handling
- **Zod** for runtime type validation
- **Papa Parse** for CSV processing
- **Lucide** for beautiful icons
- **Tailwind CSS** for utility-first styling
- **Vitest** for fast testing

## 📞 Support

For technical support or questions:
- Create an issue on GitHub
- Check the documentation wiki
- Review the troubleshooting guide above

---

**Made with ❤️ by the Development Team**
