import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Worker
global.Worker = vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  terminate: vi.fn(),
  onmessage: null,
  onerror: null,
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockImplementation(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock File API
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(chunks: any[], filename: string, options: any = {}) {
    this.name = filename;
    this.size = options.size || 1024;
    this.type = options.type || 'text/plain';
    this.lastModified = options.lastModified || Date.now();
  }

  slice() {
    return new MockFile([], this.name, { size: this.size, type: this.type });
  }
} as any;

// Mock FileReader
global.FileReader = vi.fn().mockImplementation(() => ({
  readAsText: vi.fn(),
  readAsArrayBuffer: vi.fn(),
  onload: null,
  onerror: null,
  result: null,
}));

// Suppress console warnings in tests unless explicitly needed
const originalConsoleWarn = console.warn;
console.warn = vi.fn().mockImplementation((...args) => {
  // Only show warnings that contain 'test' - customize as needed
  if (args.some(arg => typeof arg === 'string' && arg.includes('test'))) {
    originalConsoleWarn(...args);
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
