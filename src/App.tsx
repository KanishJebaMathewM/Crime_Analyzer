import React from 'react';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './contexts/ThemeContext';
import ChatBot from './components/ChatBot';

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <Dashboard />
        <ChatBot data={[]} cityStats={[]} />
      </div>
    </ThemeProvider>
  );
}

export default App;
