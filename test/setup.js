// Mock browser APIs
require('jest-webextension-mock');

// Add polyfills for TextEncoder/TextDecoder if needed
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock clipboard API
global.navigator.clipboard = {
  writeText: jest.fn(() => Promise.resolve()),
  write: jest.fn(() => Promise.resolve())
};

// Mock ClipboardItem
global.ClipboardItem = jest.fn((items) => items);

// Mock Blob for testing
global.Blob = jest.fn((content, options) => ({
  type: options.type,
  content: content
}));

// Mock setTimeout for badge timeout testing
global.originalSetTimeout = global.setTimeout;

// Allow console output during tests for debugging
// Note: If tests become too noisy, consider selective mocking

// Setup common test utilities
global.mockTab = (overrides = {}) => ({
  id: 1,
  url: 'https://example.com',
  title: 'Example Page',
  active: true,
  ...overrides
});

// Mock format registry functions
global.mockFormatConfig = (formatName, formatter) => ({
  name: formatName,
  format: formatter || jest.fn((title, url) => `${title} - ${url}`)
});

// Mock settings for tests
global.mockSettings = (overrides = {}) => ({
  defaultFormat: 'markdown',
  cleanUrls: false,
  showNotifications: false,
  showBadge: true,
  ...overrides
});